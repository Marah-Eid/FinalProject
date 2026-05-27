using Dorm.Application.DTOs.Reports;

namespace Dorm.Application.Services.Reports;

public interface IReportService
{
    /// <summary>
    /// Any authed user can flag a listing. After persisting, if there are now
    /// at least 3 Pending reports for the apartment we auto-suspend it and
    /// notify the owner.
    /// </summary>
    Task<ReportDto> SubmitAsync(Guid reporterId, SubmitReportRequest req, CancellationToken ct);
}
