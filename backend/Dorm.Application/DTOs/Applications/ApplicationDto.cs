using Dorm.Domain.Enums;

namespace Dorm.Application.DTOs.Applications;

/// <summary>
/// Student-facing view of an application. The apartment fields are embedded so
/// the my-applications page can render cards without an extra round-trip.
/// </summary>
public sealed record ApplicationDto(
    Guid Id,
    Guid ApartmentId,
    string ApartmentTitle,
    string ApartmentNeighborhood,
    string? ApartmentMainPhotoUrl,
    string Message,
    int CompatibilityScore,
    ApplicationStatus Status,
    DateTime CreatedAt,
    DateTime? RespondedAt);
