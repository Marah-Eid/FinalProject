using Dorm.Application.Abstractions;
using Dorm.Application.Common.Exceptions;
using Dorm.Application.DTOs.Reports;
using Dorm.Application.Services.Notifications;
using Dorm.Domain.Entities;
using Dorm.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Dorm.Application.Services.Reports;

public sealed class ReportService(
    IAppDbContext db,
    INotificationService notifications,
    ILogger<ReportService> logger) : IReportService
{
    /// <summary>Per the brief: 3 valid reports auto-suspend the listing pending admin review.</summary>
    private const int AutoSuspendThreshold = 3;

    public async Task<ReportDto> SubmitAsync(Guid reporterId, SubmitReportRequest req, CancellationToken ct)
    {
        var apartment = await db.Apartments
            .Include(a => a.Owner)
            .FirstOrDefaultAsync(a => a.Id == req.ApartmentId, ct)
            ?? throw new NotFoundException("Apartment not found.");

        // Owners can't report their own listing (they can just take it down).
        if (apartment.OwnerId == reporterId)
            throw new ForbiddenException("Owners can't report their own listings.");

        var report = new Report
        {
            Id = Guid.NewGuid(),
            ReporterId = reporterId,
            ReportedApartmentId = apartment.Id,
            Reason = req.Reason,
            Description = string.IsNullOrWhiteSpace(req.Description) ? null : req.Description.Trim(),
            Status = ReportStatus.Pending,
            CreatedAt = DateTime.UtcNow,
        };
        db.Reports.Add(report);
        await db.SaveChangesAsync(ct);

        // Auto-suspend check — count *Pending* reports for this listing.
        var pendingCount = await db.Reports.AsNoTracking()
            .CountAsync(r => r.ReportedApartmentId == apartment.Id && r.Status == ReportStatus.Pending, ct);

        if (pendingCount >= AutoSuspendThreshold && !apartment.IsSuspended)
        {
            apartment.IsSuspended = true;
            await db.SaveChangesAsync(ct);

            logger.LogWarning(
                "[REPORT] Apartment {ApartmentId} auto-suspended after reaching {Threshold} pending reports.",
                apartment.Id, AutoSuspendThreshold);

            await notifications.CreateAsync(
                apartment.OwnerId,
                NotificationType.ListingSuspended,
                title: $"Your listing '{apartment.Title}' has been suspended",
                content: $"It received {pendingCount} reports and is hidden from browse until an admin reviews them.",
                relatedEntityId: apartment.Id,
                ct);
        }

        var reporterName = await db.Users.AsNoTracking()
            .Where(u => u.Id == reporterId)
            .Select(u => u.FullName)
            .FirstAsync(ct);

        return new ReportDto(
            report.Id,
            apartment.Id, apartment.Title,
            reporterId, reporterName,
            report.Reason, report.Description, report.Status,
            report.CreatedAt, report.ResolvedAt);
    }
}
