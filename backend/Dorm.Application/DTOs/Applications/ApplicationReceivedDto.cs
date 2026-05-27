using Dorm.Domain.Enums;

namespace Dorm.Application.DTOs.Applications;

/// <summary>
/// Owner-facing view of an application. Per the brief, this includes the
/// student's profile photo (unlike the "current tenants" panel on the
/// apartment detail page, which intentionally hides it).
/// </summary>
public sealed record ApplicationReceivedDto(
    Guid Id,
    Guid ApartmentId,
    string ApartmentTitle,
    Guid StudentId,
    string StudentFullName,
    string? StudentProfilePhotoUrl,
    University? StudentUniversity,
    bool StudentIsUniversityVerified,
    int? StudentYear,
    string? StudentMajor,
    int CompatibilityScore,
    string Message,
    ApplicationStatus Status,
    DateTime CreatedAt,
    DateTime? RespondedAt);
