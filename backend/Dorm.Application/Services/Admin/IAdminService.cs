using Dorm.Application.DTOs.Admin;
using Dorm.Application.DTOs.Reports;
using Dorm.Domain.Enums;

namespace Dorm.Application.Services.Admin;

public interface IAdminService
{
    Task<AdminDashboardDto> GetDashboardAsync(CancellationToken ct);

    Task<IReadOnlyList<AdminUserDto>> ListUsersAsync(
        string? search, UserRole? role, int take, CancellationToken ct);

    Task BanUserAsync(Guid userId, CancellationToken ct);
    Task UnbanUserAsync(Guid userId, CancellationToken ct);

    Task<IReadOnlyList<AdminApartmentDto>> ListApartmentsAsync(
        string? search, bool? suspended, int take, CancellationToken ct);

    Task SuspendListingAsync(Guid apartmentId, CancellationToken ct);
    Task ActivateListingAsync(Guid apartmentId, CancellationToken ct);

    Task<IReadOnlyList<ReportDto>> ListReportsAsync(bool pendingOnly, int take, CancellationToken ct);
    Task ResolveReportAsync(Guid reportId, Guid adminId, ResolveReportRequest req, CancellationToken ct);
}
