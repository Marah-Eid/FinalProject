using Dorm.Application.Abstractions;
using Dorm.Application.Common;
using Dorm.Application.Common.Exceptions;
using Dorm.Application.DTOs.Apartments;
using Dorm.Application.DTOs.Compatibility;
using Dorm.Application.Services.Compatibility;
using Dorm.Domain.Entities;
using Dorm.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Dorm.Application.Services.Apartments;

/// <summary>
/// Apartments domain. Two rules that are easy to get wrong and that this service
/// enforces unconditionally:
///   • Gender visibility: a student only ever sees apartments whose GenderType
///     matches their own gender (or Mixed). Applies to GetList AND GetById.
///   • Address/phone privacy: AddressDetail and the owner's phone are hidden in
///     the detail DTO unless the caller is the owner OR has an Accepted
///     application for the apartment.
/// </summary>
public sealed class ApartmentService(
    IAppDbContext db,
    IFileStorage fileStorage,
    ICurrentUser currentUser,
    ICompatibilityService compatibility) : IApartmentService
{
    // ── Browse ──────────────────────────────────────────────────────────────
    public async Task<PaginatedResult<ApartmentListItemDto>> GetListAsync(ApartmentListQuery q, CancellationToken ct)
    {
        var query = db.Apartments.AsNoTracking()
            .Where(a => a.IsActive && !a.IsSuspended);

        // Mandatory gender visibility filter — applied at the API boundary.
        if (currentUser.Role == UserRole.Student && currentUser.Gender is { } gender)
        {
            query = query.Where(a =>
                a.GenderType == GenderType.Mixed ||
                (gender == Gender.Male   && a.GenderType == GenderType.MaleOnly) ||
                (gender == Gender.Female && a.GenderType == GenderType.FemaleOnly));
        }

        // Optional filters.
        if (q.City is { } city) query = query.Where(a => a.City == city);
        if (!string.IsNullOrWhiteSpace(q.Neighborhood))
        {
            // Case-insensitive substring match — works on both Postgres and SQL Server.
            var needle = q.Neighborhood.Trim().ToLower();
            query = query.Where(a => a.Neighborhood.ToLower().Contains(needle));
        }
        if (q.University is { } uni) query = query.Where(a => a.NearestUniversity == uni);
        if (q.MinPrice is { } minP) query = query.Where(a => a.FullRent / a.TotalSpots >= minP);
        if (q.MaxPrice is { } maxP) query = query.Where(a => a.FullRent / a.TotalSpots <= maxP);
        if (q.SpotsAvailable is { } spots)
        {
            query = query.Where(a => a.AvailableSpots >= spots);
        }
        if (q.Furnished is { } furn) query = query.Where(a => a.IsFurnished == furn);
        if (q.MaxDistance is { } maxDist) query = query.Where(a => a.DistanceMinutes <= maxDist);
        if (q.Amenities is { Count: > 0 } amenities)
        {
            // Must have EVERY requested amenity.
            var list = amenities.Distinct().ToList();
            foreach (var required in list)
                query = query.Where(a => a.Amenities.Any(am => am.AmenityType == required));
        }

        // Sort. highest_match falls back to newest until Phase 5 plugs in scoring.
        query = q.Sort switch
        {
            "price_asc"  => query.OrderBy(a => a.FullRent / a.TotalSpots).ThenByDescending(a => a.CreatedAt),
            "price_desc" => query.OrderByDescending(a => a.FullRent / a.TotalSpots).ThenByDescending(a => a.CreatedAt),
            _            => query.OrderByDescending(a => a.IsFeatured).ThenByDescending(a => a.CreatedAt),
        };

        var total = await query.CountAsync(ct);
        var page = Math.Max(1, q.Page);
        var pageSize = Math.Clamp(q.PageSize, 1, 50);

        var items = await query
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(a => new ApartmentListItemDto(
                a.Id,
                a.Title,
                a.City,
                a.Neighborhood,
                a.FullRent / a.TotalSpots,
                a.FullRent,
                a.TotalSpots,
                a.AvailableSpots,
                a.GenderType,
                a.IsFurnished,
                a.NearestUniversity,
                a.DistanceMinutes,
                a.Photos.OrderBy(p => p.DisplayOrder).Select(p => p.PhotoUrl).FirstOrDefault(),
                a.IsFeatured,
                null,  // OwnerAverageRating  — Phase 9
                0,     // OwnerRatingsCount   — Phase 9
                null,  // CompatibilityScore — populated below for logged-in students with a complete quiz
                a.CreatedAt))
            .ToListAsync(ct);

        // Compatibility injection (Phase 5). Skipped for non-students or when the
        // student's quiz isn't complete — the DTO stays as null in that case.
        items = await InjectCompatibilityIntoListAsync(items, ct);

        return PaginatedResult<ApartmentListItemDto>.Create(items, page, pageSize, total);
    }

    // ── Owner: my listings ─────────────────────────────────────────────────
    public async Task<IReadOnlyList<ApartmentListItemDto>> GetMineAsync(Guid ownerId, CancellationToken ct)
    {
        // No gender/active/suspended filters — owners see EVERYTHING they own.
        return await db.Apartments.AsNoTracking()
            .Where(a => a.OwnerId == ownerId)
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => new ApartmentListItemDto(
                a.Id,
                a.Title,
                a.City,
                a.Neighborhood,
                a.FullRent / a.TotalSpots,
                a.FullRent,
                a.TotalSpots,
                a.AvailableSpots,
                a.GenderType,
                a.IsFurnished,
                a.NearestUniversity,
                a.DistanceMinutes,
                a.Photos.OrderBy(p => p.DisplayOrder).Select(p => p.PhotoUrl).FirstOrDefault(),
                a.IsFeatured,
                null,
                0,
                null,
                a.CreatedAt))
            .ToListAsync(ct);
    }

    /// <summary>
    /// Fans out two queries (one for the student's answers, one for all tenants
    /// of the page's apartments) and rewrites each list item with its
    /// computed compatibility score.
    /// </summary>
    private async Task<List<ApartmentListItemDto>> InjectCompatibilityIntoListAsync(
        List<ApartmentListItemDto> items, CancellationToken ct)
    {
        if (items.Count == 0) return items;
        if (currentUser.Role != UserRole.Student) return items;
        if (currentUser.UserId is not { } studentUserId) return items;

        var studentAnswers = await LoadStudentAnswersAsync(studentUserId, ct);
        if (studentAnswers is null) return items;  // quiz incomplete

        var apartmentIds = items.Select(i => i.Id).ToList();
        var tenantAnswersByApartment = await LoadTenantAnswersByApartmentAsync(apartmentIds, ct);

        return items
            .Select(item =>
            {
                tenantAnswersByApartment.TryGetValue(item.Id, out var tenants);
                var result = compatibility.Compute(studentAnswers, tenants ?? Array.Empty<IReadOnlyDictionary<QuizQuestionKey, string>>());
                return item with { CompatibilityScore = result.Score };
            })
            .ToList();
    }

    // ── Detail ──────────────────────────────────────────────────────────────
    public async Task<ApartmentDetailDto> GetByIdAsync(Guid id, CancellationToken ct)
    {
        var apartment = await db.Apartments.AsNoTracking()
            .Include(a => a.Owner)
            .Include(a => a.Amenities)
            .Include(a => a.Photos)
            .Include(a => a.Tenancies.Where(t => t.Status == TenancyStatus.Active))
                .ThenInclude(t => t.Student)
                    .ThenInclude(s => s.StudentProfile!)
                        .ThenInclude(p => p.QuizAnswers)
            .FirstOrDefaultAsync(a => a.Id == id, ct);

        if (apartment is null) throw new NotFoundException("Apartment not found.");

        var isOwner = currentUser.UserId is { } uid1 && uid1 == apartment.OwnerId;

        // Gender filter — anyone but the owner gets 404 on mismatch.
        if (!isOwner && !PassesGenderFilter(apartment.GenderType))
            throw new NotFoundException("Apartment not found.");

        // Hide inactive/suspended from non-owners.
        if (!isOwner && (apartment.IsSuspended || !apartment.IsActive))
            throw new NotFoundException("Apartment not found.");

        // Privacy unlock: owner OR student with an accepted application.
        var unlockPrivate = isOwner;
        if (!unlockPrivate && currentUser.UserId is { } uid2)
        {
            unlockPrivate = await db.Applications.AsNoTracking().AnyAsync(
                ap => ap.ApartmentId == id && ap.StudentId == uid2 && ap.Status == ApplicationStatus.Accepted,
                ct);
        }

        var photos = apartment.Photos
            .OrderBy(p => p.DisplayOrder)
            .Select(p => new ApartmentPhotoDto(p.Id, p.PhotoUrl, p.DisplayOrder))
            .ToList();

        var amenities = apartment.Amenities.Select(a => a.AmenityType).ToList();

        // Compatibility: when the requester is a student with a complete quiz, compute
        // both the aggregate score and a per-tenant score for the current-tenants panel.
        IReadOnlyDictionary<QuizQuestionKey, string>? requesterAnswers = null;
        if (currentUser.Role == UserRole.Student && currentUser.UserId is { } sid)
            requesterAnswers = await LoadStudentAnswersAsync(sid, ct);

        // Pre-materialize each tenant's answers (entities already loaded via Include).
        var tenantAnswersByStudent = apartment.Tenancies.ToDictionary(
            t => t.StudentId,
            t => (IReadOnlyDictionary<QuizQuestionKey, string>)(t.Student.StudentProfile?.QuizAnswers ?? new List<QuizAnswer>())
                .ToDictionary(qa => qa.QuestionKey, qa => qa.AnswerValue));

        // Current tenants: first name only, no profile photo (privacy rule).
        var currentTenants = apartment.Tenancies
            .Select(t => new CurrentTenantDto(
                FirstName: t.Student.FullName.Split(' ')[0],
                Year: t.Student.StudentProfile?.Year,
                Major: string.IsNullOrWhiteSpace(t.Student.StudentProfile?.Major) ? null : t.Student.StudentProfile.Major,
                CompatibilityScore: requesterAnswers is not null
                    ? compatibility.ComputePairwiseScore(requesterAnswers, tenantAnswersByStudent[t.StudentId])
                    : null))
            .ToList();

        var ownerSnippet = new OwnerSnippetDto(
            apartment.Owner.Id,
            apartment.Owner.FullName,
            apartment.Owner.ProfilePhotoUrl,
            AverageRating: null,   // Phase 9
            RatingsCount: 0,
            apartment.Owner.CreatedAt);

        return new ApartmentDetailDto(
            apartment.Id,
            apartment.Title,
            apartment.Description,
            apartment.City,
            apartment.Neighborhood,
            AddressDetail: unlockPrivate ? apartment.AddressDetail : null,
            apartment.Latitude,
            apartment.Longitude,
            apartment.FullRent,
            apartment.FullRent / apartment.TotalSpots,
            apartment.TotalSpots,
            apartment.AvailableSpots,
            apartment.GenderType,
            apartment.IsFurnished,
            apartment.NearestUniversity,
            apartment.DistanceMinutes,
            apartment.SmokingRule,
            apartment.GuestsRule,
            amenities,
            photos,
            currentTenants,
            ownerSnippet,
            OwnerPhoneNumber: unlockPrivate ? apartment.Owner.PhoneNumber : null,
            apartment.IsFeatured,
            apartment.FeaturedUntil,
            apartment.IsActive,
            apartment.IsSuspended,
            CompatibilityScore: requesterAnswers is not null
                ? compatibility.Compute(requesterAnswers, tenantAnswersByStudent.Values.ToList()).Score
                : null,
            apartment.CreatedAt);
    }

    // ── Compatibility endpoint ─────────────────────────────────────────────
    public async Task<CompatibilityBreakdownDto> GetCompatibilityForStudentAsync(
        Guid apartmentId, Guid studentUserId, CancellationToken ct)
    {
        // 1. Apartment must exist and pass the gender filter for this student.
        var apartment = await db.Apartments.AsNoTracking()
            .Where(a => a.Id == apartmentId && a.IsActive && !a.IsSuspended)
            .Select(a => new { a.Id, a.GenderType })
            .FirstOrDefaultAsync(ct);
        if (apartment is null) throw new NotFoundException("Apartment not found.");
        if (!PassesGenderFilter(apartment.GenderType))
            throw new NotFoundException("Apartment not found.");

        // 2. Student must have a completed quiz; otherwise we can't compute a score.
        var studentAnswers = await LoadStudentAnswersAsync(studentUserId, ct)
            ?? throw new BadRequestException("Complete the quiz before requesting a compatibility score.");

        // 3. Fetch active tenants' answers for this apartment.
        var tenantsByApartment = await LoadTenantAnswersByApartmentAsync(new[] { apartmentId }, ct);
        tenantsByApartment.TryGetValue(apartmentId, out var tenantAnswers);

        return compatibility.Compute(
            studentAnswers,
            tenantAnswers ?? Array.Empty<IReadOnlyDictionary<QuizQuestionKey, string>>());
    }

    // ── Listing fee ──────────────────────────────────────────────────────────
    public async Task<bool> RequiresListingFeeAsync(Guid ownerId, CancellationToken ct)
    {
        var existingCount = await db.Apartments.CountAsync(a => a.OwnerId == ownerId, ct);
        if (existingCount == 0) return false;

        var hasUnusedPayment = await db.Payments.AnyAsync(p =>
            p.UserId == ownerId &&
            p.Type == PaymentType.ListingFee &&
            p.Status == PaymentStatus.Completed &&
            p.RelatedEntityId == null, ct);

        return !hasUnusedPayment;
    }

    // ── Create ──────────────────────────────────────────────────────────────
    public async Task<ApartmentDetailDto> CreateAsync(Guid ownerId, CreateApartmentRequest req, CancellationToken ct)
    {
        Payment? listingPayment = null;
        var existingCount = await db.Apartments.CountAsync(a => a.OwnerId == ownerId, ct);
        if (existingCount > 0)
        {
            listingPayment = await db.Payments
                .Where(p => p.UserId == ownerId &&
                            p.Type == PaymentType.ListingFee &&
                            p.Status == PaymentStatus.Completed &&
                            p.RelatedEntityId == null)
                .OrderByDescending(p => p.CreatedAt)
                .FirstOrDefaultAsync(ct);

            if (listingPayment is null)
                throw new BadRequestException(
                    "You must pay the 10 JOD listing fee before creating another apartment. Your first listing was free.");
        }

        var apartment = new Apartment
        {
            Id = Guid.NewGuid(),
            OwnerId = ownerId,
            Title = req.Title.Trim(),
            Description = req.Description.Trim(),
            City = req.City,
            Neighborhood = req.Neighborhood.Trim(),
            AddressDetail = req.AddressDetail.Trim(),
            Latitude = req.Latitude,
            Longitude = req.Longitude,
            FullRent = req.FullRent,
            TotalSpots = req.TotalSpots,
            AvailableSpots = req.AvailableSpots,
            GenderType = req.GenderType,
            IsFurnished = req.IsFurnished,
            NearestUniversity = req.NearestUniversity,
            DistanceMinutes = req.DistanceMinutes,
            SmokingRule = req.SmokingRule,
            GuestsRule = req.GuestsRule,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
        };

        foreach (var am in req.Amenities.Distinct())
        {
            apartment.Amenities.Add(new ApartmentAmenity
            {
                Id = Guid.NewGuid(),
                AmenityType = am,
            });
        }

        db.Apartments.Add(apartment);

        if (listingPayment is not null)
            listingPayment.RelatedEntityId = apartment.Id;

        await db.SaveChangesAsync(ct);

        return await GetByIdAsync(apartment.Id, ct);
    }

    // ── Update ──────────────────────────────────────────────────────────────
    public async Task<ApartmentDetailDto> UpdateAsync(Guid id, Guid ownerId, UpdateApartmentRequest req, CancellationToken ct)
    {
        var apartment = await db.Apartments
            .Include(a => a.Amenities)
            .FirstOrDefaultAsync(a => a.Id == id, ct)
            ?? throw new NotFoundException("Apartment not found.");

        if (apartment.OwnerId != ownerId)
            throw new ForbiddenException("You don't own this apartment.");

        apartment.Title = req.Title.Trim();
        apartment.Description = req.Description.Trim();
        apartment.City = req.City;
        apartment.Neighborhood = req.Neighborhood.Trim();
        apartment.AddressDetail = req.AddressDetail.Trim();
        apartment.Latitude = req.Latitude;
        apartment.Longitude = req.Longitude;
        apartment.FullRent = req.FullRent;
        apartment.TotalSpots = req.TotalSpots;
        apartment.AvailableSpots = req.AvailableSpots;
        apartment.GenderType = req.GenderType;
        apartment.IsFurnished = req.IsFurnished;
        apartment.NearestUniversity = req.NearestUniversity;
        apartment.DistanceMinutes = req.DistanceMinutes;
        apartment.SmokingRule = req.SmokingRule;
        apartment.GuestsRule = req.GuestsRule;
        if (req.IsActive.HasValue) apartment.IsActive = req.IsActive.Value;

        // Replace amenities atomically.
        foreach (var existing in apartment.Amenities.ToList())
            db.ApartmentAmenities.Remove(existing);
        foreach (var am in req.Amenities.Distinct())
        {
            apartment.Amenities.Add(new ApartmentAmenity
            {
                Id = Guid.NewGuid(),
                ApartmentId = apartment.Id,
                AmenityType = am,
            });
        }

        await db.SaveChangesAsync(ct);
        return await GetByIdAsync(id, ct);
    }

    // ── Delete ──────────────────────────────────────────────────────────────
    public async Task DeleteAsync(Guid id, Guid ownerId, CancellationToken ct)
    {
        var apartment = await db.Apartments
            .Include(a => a.Photos)
            .FirstOrDefaultAsync(a => a.Id == id, ct)
            ?? throw new NotFoundException("Apartment not found.");

        if (apartment.OwnerId != ownerId)
            throw new ForbiddenException("You don't own this apartment.");

        // Delete the underlying photo files; the DB rows cascade via EF config.
        foreach (var photo in apartment.Photos.ToList())
            await fileStorage.DeleteAsync(photo.PhotoUrl, ct);

        db.Apartments.Remove(apartment);
        await db.SaveChangesAsync(ct);
    }

    // ── Photos ──────────────────────────────────────────────────────────────
    public async Task<ApartmentPhotoDto> UploadPhotoAsync(
        Guid apartmentId, Guid ownerId,
        Stream content, string fileName, string contentType,
        CancellationToken ct)
    {
        var apartment = await db.Apartments
            .Include(a => a.Photos)
            .FirstOrDefaultAsync(a => a.Id == apartmentId, ct)
            ?? throw new NotFoundException("Apartment not found.");

        if (apartment.OwnerId != ownerId)
            throw new ForbiddenException("You don't own this apartment.");

        if (apartment.Photos.Count >= 10)
            throw new BadRequestException("This apartment already has the maximum of 10 photos.");

        var saved = await fileStorage.SaveAsync(content, fileName, contentType, "apartments", ct);

        var photo = new ApartmentPhoto
        {
            Id = Guid.NewGuid(),
            ApartmentId = apartmentId,
            PhotoUrl = saved.PublicPath,
            DisplayOrder = apartment.Photos.Count,
        };
        db.ApartmentPhotos.Add(photo);
        await db.SaveChangesAsync(ct);

        return new ApartmentPhotoDto(photo.Id, photo.PhotoUrl, photo.DisplayOrder);
    }

    public async Task DeletePhotoAsync(Guid apartmentId, Guid photoId, Guid ownerId, CancellationToken ct)
    {
        var apartment = await db.Apartments.FirstOrDefaultAsync(a => a.Id == apartmentId, ct)
            ?? throw new NotFoundException("Apartment not found.");

        if (apartment.OwnerId != ownerId)
            throw new ForbiddenException("You don't own this apartment.");

        var photo = await db.ApartmentPhotos
            .FirstOrDefaultAsync(p => p.Id == photoId && p.ApartmentId == apartmentId, ct)
            ?? throw new NotFoundException("Photo not found.");

        await fileStorage.DeleteAsync(photo.PhotoUrl, ct);
        db.ApartmentPhotos.Remove(photo);
        await db.SaveChangesAsync(ct);
    }

    // ── helpers ─────────────────────────────────────────────────────────────
    private bool PassesGenderFilter(GenderType apartmentGender)
    {
        if (currentUser.Role != UserRole.Student) return true;
        if (currentUser.Gender is not { } g) return true;
        return apartmentGender == GenderType.Mixed
            || (g == Gender.Male && apartmentGender == GenderType.MaleOnly)
            || (g == Gender.Female && apartmentGender == GenderType.FemaleOnly);
    }

    /// <summary>
    /// Returns the student's saved quiz answers (questionKey → value), but ONLY
    /// when their quiz is complete. Null when there's no profile or the quiz
    /// hasn't been completed — the caller treats that as "skip score injection".
    /// </summary>
    private async Task<IReadOnlyDictionary<QuizQuestionKey, string>?> LoadStudentAnswersAsync(
        Guid studentUserId, CancellationToken ct)
    {
        var rows = await db.StudentProfiles
            .AsNoTracking()
            .Where(p => p.UserId == studentUserId && p.QuizCompleted)
            .SelectMany(p => p.QuizAnswers.Select(qa => new { qa.QuestionKey, qa.AnswerValue }))
            .ToListAsync(ct);

        return rows.Count == 0 ? null : rows.ToDictionary(a => a.QuestionKey, a => a.AnswerValue);
    }

    /// <summary>
    /// Fetches the active-tenants' quiz answers for the given apartments in a
    /// single query. The result is keyed by apartmentId; each value is the list
    /// of tenant-answer dictionaries we feed straight into CompatibilityService.
    /// </summary>
    private async Task<Dictionary<Guid, IReadOnlyList<IReadOnlyDictionary<QuizQuestionKey, string>>>>
        LoadTenantAnswersByApartmentAsync(IReadOnlyCollection<Guid> apartmentIds, CancellationToken ct)
    {
        if (apartmentIds.Count == 0)
            return new Dictionary<Guid, IReadOnlyList<IReadOnlyDictionary<QuizQuestionKey, string>>>();

        // One flat row per (apartmentId, studentId, questionKey).
        var flat = await db.Tenancies
            .AsNoTracking()
            .Where(t => apartmentIds.Contains(t.ApartmentId)
                     && t.Status == TenancyStatus.Active
                     && t.Student.StudentProfile != null)
            .SelectMany(t => t.Student.StudentProfile!.QuizAnswers.Select(qa => new
            {
                ApartmentId = t.ApartmentId,
                StudentId   = t.StudentId,
                qa.QuestionKey,
                qa.AnswerValue,
            }))
            .ToListAsync(ct);

        // Group by apartment, then by student → answer-dictionary.
        var result = new Dictionary<Guid, IReadOnlyList<IReadOnlyDictionary<QuizQuestionKey, string>>>();
        foreach (var aptGroup in flat.GroupBy(r => r.ApartmentId))
        {
            var perStudent = aptGroup
                .GroupBy(r => r.StudentId)
                .Select(g => (IReadOnlyDictionary<QuizQuestionKey, string>)g.ToDictionary(
                    x => x.QuestionKey,
                    x => x.AnswerValue))
                .ToList();
            result[aptGroup.Key] = perStudent;
        }
        return result;
    }
}
