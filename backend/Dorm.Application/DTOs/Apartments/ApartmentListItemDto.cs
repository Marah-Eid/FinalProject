using Dorm.Domain.Enums;

namespace Dorm.Application.DTOs.Apartments;

/// <summary>Shape returned in the paginated browse list.</summary>
public sealed record ApartmentListItemDto(
    Guid Id,
    string Title,
    City City,
    string Neighborhood,
    decimal PricePerPerson,
    decimal FullRent,
    int TotalSpots,
    int AvailableSpots,
    GenderType GenderType,
    bool IsFurnished,
    University NearestUniversity,
    int DistanceMinutes,
    string? MainPhotoUrl,
    double? OwnerAverageRating,
    int OwnerRatingsCount,
    /// <summary>Populated for logged-in students whose quiz is complete (Phase 5).</summary>
    int? CompatibilityScore,
    DateTime CreatedAt);
