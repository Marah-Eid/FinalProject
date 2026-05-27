using Dorm.Domain.Enums;

namespace Dorm.Application.DTOs.Admin;

public sealed record AdminDashboardDto(
    int TotalUsers,
    int TotalStudents,
    int TotalOwners,
    int ActiveListings,
    int SuspendedListings,
    int TenanciesThisMonth,
    int ActiveTenancies,
    int PendingReports,
    decimal RevenueThisMonthJod,
    decimal RevenueAllTimeJod,
    IReadOnlyList<RevenueByTypeRow> RevenueByType);

public sealed record RevenueByTypeRow(PaymentType Type, int Count, decimal Total);

public sealed record AdminUserDto(
    Guid Id,
    string FullName,
    string Email,
    UserRole Role,
    Gender Gender,
    bool IsEmailVerified,
    bool IsUniversityVerified,
    bool IsBanned,
    DateTime CreatedAt);

public sealed record AdminApartmentDto(
    Guid Id,
    string Title,
    string Neighborhood,
    City City,
    Guid OwnerId,
    string OwnerName,
    int AvailableSpots,
    int TotalSpots,
    bool IsActive,
    bool IsSuspended,
    int PendingReportsCount,
    DateTime CreatedAt);

public sealed record ResolveReportRequest(
    /// <summary>If true, mark the reports as Dismissed and lift the suspension. If false (or omitted), mark as Resolved and keep the listing suspended.</summary>
    bool Dismiss = false);
