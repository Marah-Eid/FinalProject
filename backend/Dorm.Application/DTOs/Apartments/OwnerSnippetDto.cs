namespace Dorm.Application.DTOs.Apartments;

/// <summary>
/// Owner info shown next to a listing. Phone is intentionally NOT here —
/// it appears on the detail page only after the requesting student has an
/// Accepted application (then the controller returns it in a separate field).
/// </summary>
public sealed record OwnerSnippetDto(
    Guid Id,
    string FullName,
    string? ProfilePhotoUrl,
    double? AverageRating,
    int RatingsCount,
    DateTime MemberSince,
    bool IsIdVerified = false);
