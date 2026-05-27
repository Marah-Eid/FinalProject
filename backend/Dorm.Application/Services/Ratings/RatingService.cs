using Dorm.Application.Abstractions;
using Dorm.Application.Common.Exceptions;
using Dorm.Application.DTOs.Ratings;
using Dorm.Application.Services.Notifications;
using Dorm.Domain.Entities;
using Dorm.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Dorm.Application.Services.Ratings;

public sealed class RatingService(
    IAppDbContext db,
    INotificationService notifications) : IRatingService
{
    public async Task<RatingDto> SubmitAsync(Guid raterId, SubmitRatingRequest req, CancellationToken ct)
    {
        var apartment = await db.Apartments.AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == req.ApartmentId, ct)
            ?? throw new NotFoundException("Apartment not found.");

        // The valid pairs are (owner ↔ ex-tenant) — verify which direction the rater is on.
        var raterIsOwner = apartment.OwnerId == raterId;
        var raterIsTenant = !raterIsOwner;

        if (raterIsOwner)
        {
            // Rater is the owner; the rated must be a student who actually rented here.
            var hasEnded = await db.Tenancies.AsNoTracking().AnyAsync(t =>
                t.ApartmentId == req.ApartmentId
                && t.StudentId == req.RatedUserId
                && t.Status == TenancyStatus.Ended, ct);
            if (!hasEnded)
                throw new ForbiddenException("You can only rate students whose tenancy at this apartment has ended.");
        }
        else if (raterIsTenant)
        {
            // Rater is an ex-tenant; the rated must be the owner of this apartment.
            if (apartment.OwnerId != req.RatedUserId)
                throw new ForbiddenException("Tenants can only rate the apartment's owner.");

            var hasEnded = await db.Tenancies.AsNoTracking().AnyAsync(t =>
                t.ApartmentId == req.ApartmentId
                && t.StudentId == raterId
                && t.Status == TenancyStatus.Ended, ct);
            if (!hasEnded)
                throw new ForbiddenException("You can only rate after your tenancy has ended.");
        }

        // One rating per (rater, rated, apartment) — DB has a unique index for this.
        var existing = await db.Ratings.AsNoTracking().AnyAsync(r =>
            r.RaterId == raterId
            && r.RatedUserId == req.RatedUserId
            && r.ApartmentId == req.ApartmentId, ct);
        if (existing)
            throw new ConflictException("You've already rated this person for this apartment.");

        var rating = new Rating
        {
            Id = Guid.NewGuid(),
            RaterId = raterId,
            RatedUserId = req.RatedUserId,
            ApartmentId = req.ApartmentId,
            Stars = req.Stars,
            Comment = string.IsNullOrWhiteSpace(req.Comment) ? null : req.Comment.Trim(),
            CreatedAt = DateTime.UtcNow,
        };
        db.Ratings.Add(rating);
        await db.SaveChangesAsync(ct);

        await notifications.CreateAsync(
            req.RatedUserId,
            NotificationType.NewRating,
            title: $"You received a {req.Stars}/5 rating",
            content: string.IsNullOrWhiteSpace(req.Comment)
                ? "A previous roommate / owner left you a star rating."
                : $"\"{TruncateForPreview(req.Comment!)}\"",
            relatedEntityId: rating.Id,
            ct);

        var rater = await db.Users.AsNoTracking()
            .Where(u => u.Id == raterId)
            .Select(u => new { u.FullName, u.ProfilePhotoUrl })
            .FirstAsync(ct);

        return new RatingDto(
            rating.Id, raterId, rater.FullName, rater.ProfilePhotoUrl,
            apartment.Id, apartment.Title,
            rating.Stars, rating.Comment, rating.CreatedAt);
    }

    public Task<IReadOnlyList<RatingDto>> GetForUserAsync(Guid userId, CancellationToken ct) =>
        db.Ratings.AsNoTracking()
            .Where(r => r.RatedUserId == userId)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new RatingDto(
                r.Id,
                r.RaterId, r.Rater.FullName, r.Rater.ProfilePhotoUrl,
                r.ApartmentId, r.Apartment.Title,
                r.Stars, r.Comment, r.CreatedAt))
            .ToListAsync(ct)
            .ContinueWith(t => (IReadOnlyList<RatingDto>)t.Result, ct);

    public async Task EndTenancyAsync(Guid tenancyId, Guid callerId, CancellationToken ct)
    {
        var tenancy = await db.Tenancies
            .Include(t => t.Apartment)
            .FirstOrDefaultAsync(t => t.Id == tenancyId, ct)
            ?? throw new NotFoundException("Tenancy not found.");

        var isStudent = tenancy.StudentId == callerId;
        var isOwner = tenancy.Apartment.OwnerId == callerId;
        if (!isStudent && !isOwner)
            throw new ForbiddenException("You can only end a tenancy you're part of.");

        if (tenancy.Status != TenancyStatus.Active)
            throw new BadRequestException("This tenancy has already ended.");

        tenancy.Status = TenancyStatus.Ended;
        tenancy.EndDate = DateTime.UtcNow;
        tenancy.Apartment.AvailableSpots += 1;  // the spot is free again
        await db.SaveChangesAsync(ct);

        // Both parties can now rate each other — nudge them.
        await notifications.CreateAsync(
            tenancy.StudentId,
            NotificationType.NewRating,
            title: $"Tenancy ended at {tenancy.Apartment.Title}",
            content: "Tell future students how it was — rate the owner.",
            relatedEntityId: tenancy.Id, ct);

        await notifications.CreateAsync(
            tenancy.Apartment.OwnerId,
            NotificationType.NewRating,
            title: "Tenancy ended — rate the student",
            content: "Help other owners by sharing how it went.",
            relatedEntityId: tenancy.Id, ct);
    }

    private static string TruncateForPreview(string s) =>
        s.Length > 140 ? s[..137] + "…" : s;
}
