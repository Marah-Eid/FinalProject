using Dorm.Application.Abstractions;
using Dorm.Application.Common.Exceptions;
using Dorm.Application.DTOs.Applications;
using Dorm.Application.Services.Compatibility;
using Dorm.Application.Services.Notifications;
using Dorm.Domain.Entities;
using Dorm.Domain.Enums;
using Microsoft.EntityFrameworkCore;
// Alias because the `Application` *entity* name collides with the `Dorm.Application` *namespace*.
using AppApplication = Dorm.Domain.Entities.Application;

namespace Dorm.Application.Services.Applications;

public sealed class ApplicationService(
    IAppDbContext db,
    ICompatibilityService compatibility,
    INotificationService notifications,
    IEmailService email) : IApplicationService
{
    // ── Apply ───────────────────────────────────────────────────────────────
    public async Task<ApplicationDto> ApplyAsync(
        Guid studentId, Guid apartmentId, ApplyRequest req, CancellationToken ct)
    {
        var student = await db.Users.AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == studentId, ct)
            ?? throw new NotFoundException("User not found.");
        if (student.Role != UserRole.Student)
            throw new ForbiddenException("Only students can apply to apartments.");

        var apartment = await db.Apartments
            .Include(a => a.Owner)
            .FirstOrDefaultAsync(a => a.Id == apartmentId, ct)
            ?? throw new NotFoundException("Apartment not found.");

        if (!apartment.IsActive || apartment.IsSuspended)
            throw new BadRequestException("This apartment isn't accepting applications.");
        if (apartment.AvailableSpots <= 0)
            throw new ConflictException("This apartment has no available spots.");

        // Gender visibility — same rule as the browse filter, enforced here too.
        var matchesGender = apartment.GenderType == GenderType.Mixed
            || (student.Gender == Gender.Male && apartment.GenderType == GenderType.MaleOnly)
            || (student.Gender == Gender.Female && apartment.GenderType == GenderType.FemaleOnly);
        if (!matchesGender)
            throw new ForbiddenException("This apartment isn't open to your gender preference.");

        // One outstanding (Pending) application per (student, apartment).
        var existing = await db.Applications
            .AsNoTracking()
            .AnyAsync(a => a.ApartmentId == apartmentId
                        && a.StudentId == studentId
                        && a.Status == ApplicationStatus.Pending, ct);
        if (existing)
            throw new ConflictException("You already have a pending application for this apartment.");

        // Snapshot the compatibility score at submission time.
        var compatScore = await ComputeCompatibilitySnapshotAsync(studentId, apartmentId, ct);

        var application = new AppApplication
        {
            Id = Guid.NewGuid(),
            ApartmentId = apartmentId,
            StudentId = studentId,
            Message = req.Message.Trim(),
            CompatibilityScore = compatScore,
            Status = ApplicationStatus.Pending,
            CreatedAt = DateTime.UtcNow,
        };
        db.Applications.Add(application);

        // Find-or-create the conversation for this (student, owner, apartment) triple.
        var ownerId = apartment.OwnerId;
        var conversationExists = await db.Conversations.AnyAsync(c =>
            c.ApartmentId == apartmentId &&
            ((c.Participant1Id == studentId && c.Participant2Id == ownerId) ||
             (c.Participant1Id == ownerId   && c.Participant2Id == studentId)), ct);
        if (!conversationExists)
        {
            db.Conversations.Add(new Conversation
            {
                Id = Guid.NewGuid(),
                Participant1Id = studentId,  // by convention: student is P1, owner P2
                Participant2Id = ownerId,
                ApartmentId = apartmentId,
                LastMessageAt = DateTime.UtcNow,
            });
        }

        await db.SaveChangesAsync(ct);

        // Side effects — notification + email to the owner. We do these AFTER the
        // initial save so the user-visible "application created" state is durable
        // even if the notification side-effect fails for a transient reason.
        await notifications.CreateAsync(
            ownerId,
            NotificationType.NewApplicationReceived,
            title: $"New application for {apartment.Title}",
            content: $"{student.FullName} applied with a {compatScore}% compatibility match.",
            relatedEntityId: application.Id,
            ct);

        await email.SendApplicationReceivedAsync(
            apartment.Owner.Email, apartment.Owner.FullName,
            student.FullName, apartment.Title, compatScore, ct);

        return BuildStudentDto(application, apartment);
    }

    // ── Mine ────────────────────────────────────────────────────────────────
    public async Task<IReadOnlyList<ApplicationDto>> GetMineAsync(Guid studentId, CancellationToken ct)
    {
        var apps = await db.Applications.AsNoTracking()
            .Where(a => a.StudentId == studentId)
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => new ApplicationDto(
                a.Id,
                a.ApartmentId,
                a.Apartment.Title,
                a.Apartment.Neighborhood,
                a.Apartment.Photos.OrderBy(p => p.DisplayOrder).Select(p => p.PhotoUrl).FirstOrDefault(),
                a.Message,
                a.CompatibilityScore,
                a.Status,
                a.CreatedAt,
                a.RespondedAt,
                null))
            .ToListAsync(ct);

        var acceptedAptIds = apps
            .Where(a => a.Status == ApplicationStatus.Accepted)
            .Select(a => a.ApartmentId).Distinct().ToList();

        if (acceptedAptIds.Count == 0) return apps;

        var tenancies = await db.Tenancies.AsNoTracking()
            .Where(t => t.StudentId == studentId && acceptedAptIds.Contains(t.ApartmentId))
            .ToDictionaryAsync(t => t.ApartmentId, ct);

        var commissions = await db.Payments.AsNoTracking()
            .Where(p => p.UserId == studentId && p.Type == PaymentType.MatchCommission && p.Status == PaymentStatus.Completed)
            .Select(p => p.RelatedEntityId)
            .ToListAsync(ct);

        var contactedOwnerApts = await db.Conversations.AsNoTracking()
            .Where(c => acceptedAptIds.Contains(c.ApartmentId) &&
                        (c.Participant1Id == studentId || c.Participant2Id == studentId))
            .Where(c => c.Messages.Any(m => m.SenderId == studentId))
            .Select(c => c.ApartmentId)
            .ToListAsync(ct);

        var ratedApts = await db.Ratings.AsNoTracking()
            .Where(r => r.RaterId == studentId && acceptedAptIds.Contains(r.ApartmentId))
            .Select(r => r.ApartmentId)
            .ToListAsync(ct);

        return apps.Select(a =>
        {
            if (a.Status != ApplicationStatus.Accepted) return a;

            tenancies.TryGetValue(a.ApartmentId, out var tenancy);
            var commPaid = commissions.Contains(a.ApartmentId);
            var contacted = contactedOwnerApts.Contains(a.ApartmentId);
            var rated = ratedApts.Contains(a.ApartmentId);
            var movedIn = tenancy?.MovedInAt != null;
            var plannedDate = tenancy?.PlannedMoveInDate;

            var completed = 1 + (contacted ? 1 : 0) + (commPaid ? 1 : 0)
                          + (plannedDate != null ? 1 : 0) + (movedIn ? 1 : 0) + (rated ? 1 : 0);

            var checklist = new MoveInChecklistDto(
                ApplicationAccepted: true,
                CommissionPaid: commPaid,
                OwnerContacted: contacted,
                OwnerContactShared: commPaid,
                PlannedMoveInDate: plannedDate,
                MovedIn: movedIn,
                ExperienceRated: rated,
                CompletedSteps: completed,
                TotalSteps: 6);

            return a with { Checklist = checklist };
        }).ToList();
    }

    // ── Received (owner) ────────────────────────────────────────────────────
    public async Task<IReadOnlyList<ApplicationReceivedDto>> GetReceivedAsync(Guid ownerId, CancellationToken ct)
    {
        var rawApps = await db.Applications.AsNoTracking()
            .Where(a => a.Apartment.OwnerId == ownerId)
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => new
            {
                a.Id, a.ApartmentId, ApartmentTitle = a.Apartment.Title,
                a.StudentId, StudentFullName = a.Student.FullName,
                a.Student.ProfilePhotoUrl, a.Student.University,
                a.Student.IsUniversityVerified,
                Year = a.Student.StudentProfile == null ? (int?)null : a.Student.StudentProfile.Year,
                Major = a.Student.StudentProfile == null ? null : a.Student.StudentProfile.Major,
                a.CompatibilityScore, a.Message, a.Status, a.CreatedAt, a.RespondedAt,
            })
            .ToListAsync(ct);

        var studentIds = rawApps.Select(a => a.StudentId).Distinct().ToList();
        var apartmentIds = rawApps.Select(a => a.ApartmentId).Distinct().ToList();

        var studentAnswers = await db.QuizAnswers.AsNoTracking()
            .Where(qa => studentIds.Contains(qa.StudentProfile.UserId))
            .Select(qa => new { UserId = qa.StudentProfile.UserId, qa.QuestionKey, qa.AnswerValue })
            .ToListAsync(ct);
        var studentAnswersByUser = studentAnswers
            .GroupBy(a => a.UserId)
            .ToDictionary(g => g.Key, g => (IReadOnlyDictionary<QuizQuestionKey, string>)g.ToDictionary(a => a.QuestionKey, a => a.AnswerValue));

        var tenantAnswers = await db.Tenancies.AsNoTracking()
            .Where(t => apartmentIds.Contains(t.ApartmentId) && t.Status == TenancyStatus.Active && t.Student.StudentProfile != null)
            .SelectMany(t => t.Student.StudentProfile!.QuizAnswers.Select(qa => new { t.ApartmentId, t.StudentId, qa.QuestionKey, qa.AnswerValue }))
            .ToListAsync(ct);
        var tenantsByApartment = tenantAnswers
            .GroupBy(t => t.ApartmentId)
            .ToDictionary(g => g.Key, g => (IReadOnlyList<IReadOnlyDictionary<QuizQuestionKey, string>>)g
                .GroupBy(t => t.StudentId)
                .Select(sg => (IReadOnlyDictionary<QuizQuestionKey, string>)sg.ToDictionary(a => a.QuestionKey, a => a.AnswerValue))
                .ToList());

        return rawApps.Select(a =>
        {
            IReadOnlyList<QuizQuestionKey>? matched = null;
            IReadOnlyList<QuizQuestionKey>? differed = null;

            if (studentAnswersByUser.TryGetValue(a.StudentId, out var sAnswers))
            {
                tenantsByApartment.TryGetValue(a.ApartmentId, out var tAnswers);
                var breakdown = compatibility.Compute(sAnswers, tAnswers ?? Array.Empty<IReadOnlyDictionary<QuizQuestionKey, string>>());
                matched = breakdown.MatchedOn;
                differed = breakdown.DifferedOn;
            }

            return new ApplicationReceivedDto(
                a.Id, a.ApartmentId, a.ApartmentTitle,
                a.StudentId, a.StudentFullName, a.ProfilePhotoUrl,
                a.University, a.IsUniversityVerified,
                a.Year, a.Major, a.CompatibilityScore,
                matched, differed,
                a.Message, a.Status, a.CreatedAt, a.RespondedAt);
        }).ToList();
    }

    // ── Accept ──────────────────────────────────────────────────────────────
    public async Task<ApplicationDto> AcceptAsync(Guid applicationId, Guid ownerId, CancellationToken ct)
    {
        var (application, apartment, student) = await LoadForOwnerActionAsync(applicationId, ownerId, ct);
        if (application.Status != ApplicationStatus.Pending)
            throw new BadRequestException("Only pending applications can be accepted.");
        if (apartment.AvailableSpots <= 0)
            throw new ConflictException("This apartment has no available spots left.");

        // Side-effects per brief: spots-, Tenancy+, status update, notify, email.
        apartment.AvailableSpots -= 1;
        application.Status = ApplicationStatus.Accepted;
        application.RespondedAt = DateTime.UtcNow;

        db.Tenancies.Add(new Tenancy
        {
            Id = Guid.NewGuid(),
            ApartmentId = apartment.Id,
            StudentId = student.Id,
            StartDate = DateTime.UtcNow,
            EndDate = null,
            Status = TenancyStatus.Active,
        });

        await db.SaveChangesAsync(ct);

        await notifications.CreateAsync(
            student.Id,
            NotificationType.ApplicationAccepted,
            title: $"Your application for {apartment.Title} was accepted",
            content: "The owner has accepted your application. The exact address and phone are now visible on the listing. " +
                     "Next step: complete the 15 JOD platform fee.",
            relatedEntityId: application.Id,
            ct);

        await email.SendApplicationAcceptedAsync(
            student.Email, student.FullName,
            apartment.Title, apartment.Owner.PhoneNumber, ct);

        return BuildStudentDto(application, apartment);
    }

    // ── Reject ──────────────────────────────────────────────────────────────
    public async Task<ApplicationDto> RejectAsync(Guid applicationId, Guid ownerId, CancellationToken ct)
    {
        var (application, apartment, student) = await LoadForOwnerActionAsync(applicationId, ownerId, ct);
        if (application.Status != ApplicationStatus.Pending)
            throw new BadRequestException("Only pending applications can be rejected.");

        application.Status = ApplicationStatus.Rejected;
        application.RespondedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);

        await notifications.CreateAsync(
            student.Id,
            NotificationType.ApplicationRejected,
            title: $"Update on your application for {apartment.Title}",
            content: "Unfortunately the owner is moving forward with other candidates. Keep browsing — your next match is out there.",
            relatedEntityId: application.Id,
            ct);

        await email.SendApplicationRejectedAsync(
            student.Email, student.FullName, apartment.Title, ct);

        return BuildStudentDto(application, apartment);
    }

    // ── Withdraw ────────────────────────────────────────────────────────────
    public async Task WithdrawAsync(Guid applicationId, Guid studentId, CancellationToken ct)
    {
        var application = await db.Applications
            .FirstOrDefaultAsync(a => a.Id == applicationId, ct)
            ?? throw new NotFoundException("Application not found.");

        if (application.StudentId != studentId)
            throw new ForbiddenException("You can only withdraw your own applications.");
        if (application.Status != ApplicationStatus.Pending)
            throw new BadRequestException("Only pending applications can be withdrawn.");

        application.Status = ApplicationStatus.Withdrawn;
        application.RespondedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
    }

    // ── helpers ─────────────────────────────────────────────────────────────

    private async Task<(AppApplication app, Apartment apt, User student)> LoadForOwnerActionAsync(
        Guid applicationId, Guid ownerId, CancellationToken ct)
    {
        var application = await db.Applications
            .Include(a => a.Apartment).ThenInclude(ap => ap.Owner)
            .Include(a => a.Student)
            .FirstOrDefaultAsync(a => a.Id == applicationId, ct)
            ?? throw new NotFoundException("Application not found.");

        if (application.Apartment.OwnerId != ownerId)
            throw new ForbiddenException("You don't own this listing.");

        return (application, application.Apartment, application.Student);
    }

    private async Task<int> ComputeCompatibilitySnapshotAsync(
        Guid studentId, Guid apartmentId, CancellationToken ct)
    {
        var studentAnswers = await db.StudentProfiles.AsNoTracking()
            .Where(p => p.UserId == studentId && p.QuizCompleted)
            .SelectMany(p => p.QuizAnswers.Select(qa => new { qa.QuestionKey, qa.AnswerValue }))
            .ToListAsync(ct);

        if (studentAnswers.Count == 0)
            throw new BadRequestException("Complete the quiz before applying to an apartment.");

        var studentDict = studentAnswers.ToDictionary(a => a.QuestionKey, a => a.AnswerValue);

        var flatTenants = await db.Tenancies.AsNoTracking()
            .Where(t => t.ApartmentId == apartmentId
                     && t.Status == TenancyStatus.Active
                     && t.Student.StudentProfile != null)
            .SelectMany(t => t.Student.StudentProfile!.QuizAnswers.Select(qa => new
            {
                t.StudentId,
                qa.QuestionKey,
                qa.AnswerValue,
            }))
            .ToListAsync(ct);

        var tenants = flatTenants
            .GroupBy(r => r.StudentId)
            .Select(g => (IReadOnlyDictionary<QuizQuestionKey, string>)
                g.ToDictionary(r => r.QuestionKey, r => r.AnswerValue))
            .ToList();

        return compatibility.Compute(studentDict, tenants).Score;
    }

    private static ApplicationDto BuildStudentDto(AppApplication a, Apartment apt) => new(
        a.Id,
        apt.Id,
        apt.Title,
        apt.Neighborhood,
        apt.Photos.OrderBy(p => p.DisplayOrder).Select(p => p.PhotoUrl).FirstOrDefault(),
        a.Message,
        a.CompatibilityScore,
        a.Status,
        a.CreatedAt,
        a.RespondedAt);
}
