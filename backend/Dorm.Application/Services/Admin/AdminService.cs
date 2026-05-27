using Dorm.Application.Abstractions;
using Dorm.Application.Common.Exceptions;
using Dorm.Application.DTOs.Admin;
using Dorm.Application.DTOs.Reports;
using Dorm.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Dorm.Application.Services.Admin;

public sealed class AdminService(IAppDbContext db) : IAdminService
{
    public async Task<AdminDashboardDto> GetDashboardAsync(CancellationToken ct)
    {
        // Cheap aggregate queries — fine to fire in parallel since each uses its own connection.
        var startOfMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        var totalUsers = await db.Users.AsNoTracking().CountAsync(ct);
        var totalStudents = await db.Users.AsNoTracking().CountAsync(u => u.Role == UserRole.Student, ct);
        var totalOwners = await db.Users.AsNoTracking().CountAsync(u => u.Role == UserRole.Owner, ct);

        var activeListings = await db.Apartments.AsNoTracking().CountAsync(a => a.IsActive && !a.IsSuspended, ct);
        var suspendedListings = await db.Apartments.AsNoTracking().CountAsync(a => a.IsSuspended, ct);

        var tenanciesThisMonth = await db.Tenancies.AsNoTracking()
            .CountAsync(t => t.StartDate >= startOfMonth, ct);
        var activeTenancies = await db.Tenancies.AsNoTracking()
            .CountAsync(t => t.Status == TenancyStatus.Active, ct);

        var pendingReports = await db.Reports.AsNoTracking()
            .CountAsync(r => r.Status == ReportStatus.Pending, ct);

        var revenueThisMonth = await db.Payments.AsNoTracking()
            .Where(p => p.Status == PaymentStatus.Completed && p.CreatedAt >= startOfMonth)
            .SumAsync(p => (decimal?)p.Amount, ct) ?? 0m;

        var revenueAllTime = await db.Payments.AsNoTracking()
            .Where(p => p.Status == PaymentStatus.Completed)
            .SumAsync(p => (decimal?)p.Amount, ct) ?? 0m;

        var revenueByType = await db.Payments.AsNoTracking()
            .Where(p => p.Status == PaymentStatus.Completed)
            .GroupBy(p => p.Type)
            .Select(g => new RevenueByTypeRow(g.Key, g.Count(), g.Sum(p => p.Amount)))
            .ToListAsync(ct);

        return new AdminDashboardDto(
            totalUsers, totalStudents, totalOwners,
            activeListings, suspendedListings,
            tenanciesThisMonth, activeTenancies,
            pendingReports,
            revenueThisMonth, revenueAllTime,
            revenueByType);
    }

    public Task<IReadOnlyList<AdminUserDto>> ListUsersAsync(
        string? search, UserRole? role, int take, CancellationToken ct)
    {
        var query = db.Users.AsNoTracking().AsQueryable();
        if (role is { } r) query = query.Where(u => u.Role == r);
        if (!string.IsNullOrWhiteSpace(search))
        {
            var needle = search.Trim().ToLower();
            query = query.Where(u =>
                u.FullName.ToLower().Contains(needle) || u.Email.ToLower().Contains(needle));
        }
        return query
            .OrderByDescending(u => u.CreatedAt)
            .Take(Math.Clamp(take, 1, 200))
            .Select(u => new AdminUserDto(
                u.Id, u.FullName, u.Email, u.Role, u.Gender,
                u.IsEmailVerified, u.IsUniversityVerified, u.IsBanned, u.CreatedAt))
            .ToListAsync(ct)
            .ContinueWith(t => (IReadOnlyList<AdminUserDto>)t.Result, ct);
    }

    public async Task BanUserAsync(Guid userId, CancellationToken ct)
    {
        var rows = await db.Users.Where(u => u.Id == userId)
            .ExecuteUpdateAsync(s => s.SetProperty(u => u.IsBanned, true), ct);
        if (rows == 0) throw new NotFoundException("User not found.");
    }

    public async Task UnbanUserAsync(Guid userId, CancellationToken ct)
    {
        var rows = await db.Users.Where(u => u.Id == userId)
            .ExecuteUpdateAsync(s => s.SetProperty(u => u.IsBanned, false), ct);
        if (rows == 0) throw new NotFoundException("User not found.");
    }

    public Task<IReadOnlyList<AdminApartmentDto>> ListApartmentsAsync(
        string? search, bool? suspended, int take, CancellationToken ct)
    {
        var query = db.Apartments.AsNoTracking().AsQueryable();
        if (suspended is { } s) query = query.Where(a => a.IsSuspended == s);
        if (!string.IsNullOrWhiteSpace(search))
        {
            var needle = search.Trim().ToLower();
            query = query.Where(a =>
                a.Title.ToLower().Contains(needle)
                || a.Neighborhood.ToLower().Contains(needle));
        }

        return query
            .OrderByDescending(a => a.CreatedAt)
            .Take(Math.Clamp(take, 1, 200))
            .Select(a => new AdminApartmentDto(
                a.Id,
                a.Title,
                a.Neighborhood,
                a.City,
                a.OwnerId,
                a.Owner.FullName,
                a.AvailableSpots,
                a.TotalSpots,
                a.IsActive,
                a.IsSuspended,
                db.Reports.Count(r => r.ReportedApartmentId == a.Id && r.Status == ReportStatus.Pending),
                a.CreatedAt))
            .ToListAsync(ct)
            .ContinueWith(t => (IReadOnlyList<AdminApartmentDto>)t.Result, ct);
    }

    public async Task SuspendListingAsync(Guid apartmentId, CancellationToken ct)
    {
        var rows = await db.Apartments.Where(a => a.Id == apartmentId)
            .ExecuteUpdateAsync(s => s.SetProperty(a => a.IsSuspended, true), ct);
        if (rows == 0) throw new NotFoundException("Apartment not found.");
    }

    public async Task ActivateListingAsync(Guid apartmentId, CancellationToken ct)
    {
        var rows = await db.Apartments.Where(a => a.Id == apartmentId)
            .ExecuteUpdateAsync(s => s
                .SetProperty(a => a.IsSuspended, false)
                .SetProperty(a => a.IsActive, true), ct);
        if (rows == 0) throw new NotFoundException("Apartment not found.");
    }

    public Task<IReadOnlyList<ReportDto>> ListReportsAsync(bool pendingOnly, int take, CancellationToken ct)
    {
        var query = db.Reports.AsNoTracking().AsQueryable();
        if (pendingOnly) query = query.Where(r => r.Status == ReportStatus.Pending);
        return query
            .OrderByDescending(r => r.CreatedAt)
            .Take(Math.Clamp(take, 1, 200))
            .Select(r => new ReportDto(
                r.Id,
                r.ReportedApartmentId, r.ReportedApartment.Title,
                r.ReporterId, r.Reporter.FullName,
                r.Reason, r.Description, r.Status,
                r.CreatedAt, r.ResolvedAt))
            .ToListAsync(ct)
            .ContinueWith(t => (IReadOnlyList<ReportDto>)t.Result, ct);
    }

    public async Task ResolveReportAsync(Guid reportId, Guid adminId, ResolveReportRequest req, CancellationToken ct)
    {
        var report = await db.Reports
            .Include(r => r.ReportedApartment)
            .FirstOrDefaultAsync(r => r.Id == reportId, ct)
            ?? throw new NotFoundException("Report not found.");

        if (report.Status != ReportStatus.Pending)
            throw new BadRequestException("Only pending reports can be resolved.");

        report.Status = req.Dismiss ? ReportStatus.Dismissed : ReportStatus.Resolved;
        report.ResolvedAt = DateTime.UtcNow;
        report.ResolvedByAdminId = adminId;

        // If the admin dismissed and no other Pending reports remain on the listing, lift the suspension.
        if (req.Dismiss && report.ReportedApartment.IsSuspended)
        {
            var stillPending = await db.Reports
                .CountAsync(r => r.ReportedApartmentId == report.ReportedApartmentId
                              && r.Status == ReportStatus.Pending
                              && r.Id != reportId, ct);
            if (stillPending == 0)
                report.ReportedApartment.IsSuspended = false;
        }

        await db.SaveChangesAsync(ct);
    }
}
