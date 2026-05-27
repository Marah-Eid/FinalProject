using Dorm.Domain.Enums;

namespace Dorm.Application.DTOs.Reports;

public sealed record SubmitReportRequest(
    Guid ApartmentId,
    ReportReason Reason,
    string? Description);

public sealed record ReportDto(
    Guid Id,
    Guid ReportedApartmentId,
    string ApartmentTitle,
    Guid ReporterId,
    string ReporterName,
    ReportReason Reason,
    string? Description,
    ReportStatus Status,
    DateTime CreatedAt,
    DateTime? ResolvedAt);
