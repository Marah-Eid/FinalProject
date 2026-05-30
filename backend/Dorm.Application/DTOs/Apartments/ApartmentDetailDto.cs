using Dorm.Domain.Enums;

namespace Dorm.Application.DTOs.Apartments;

/// <summary>
/// Full detail-page shape. Sensitive fields are nullable and populated only when
/// the requester is the owner OR the requester has an Accepted application for
/// this apartment.
/// </summary>
public sealed record ApartmentDetailDto(
    Guid Id,
    string Title,
    string Description,

    City City,
    string Neighborhood,

    /// <summary>Street-level address. NULL unless the caller is the owner or has an accepted application.</summary>
    string? AddressDetail,

    double Latitude,
    double Longitude,

    decimal FullRent,
    decimal PricePerPerson,
    int TotalSpots,
    int AvailableSpots,

    GenderType GenderType,
    bool IsFurnished,
    University NearestUniversity,
    int DistanceMinutes,
    SmokingRule SmokingRule,
    GuestsRule GuestsRule,

    IReadOnlyList<AmenityType> Amenities,
    IReadOnlyList<ApartmentPhotoDto> Photos,
    IReadOnlyList<CurrentTenantDto> CurrentTenants,

    OwnerSnippetDto Owner,
    /// <summary>NULL unless the caller is the owner or has an accepted application.</summary>
    string? OwnerPhoneNumber,

    bool IsActive,
    bool IsSuspended,

    /// <summary>Populated for logged-in students whose quiz is complete (Phase 5).</summary>
    int? CompatibilityScore,
    DateTime CreatedAt);
