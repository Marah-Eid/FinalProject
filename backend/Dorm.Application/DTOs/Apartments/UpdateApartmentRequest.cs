using Dorm.Domain.Enums;

namespace Dorm.Application.DTOs.Apartments;

/// <summary>
/// Owner updates the listing. Same shape as Create except IDs of photos —
/// photo additions/deletions are separate endpoints.
/// </summary>
public sealed record UpdateApartmentRequest(
    string Title,
    string Description,
    City City,
    string Neighborhood,
    string AddressDetail,
    double Latitude,
    double Longitude,
    decimal FullRent,
    int TotalSpots,
    int AvailableSpots,
    GenderType GenderType,
    bool IsFurnished,
    University NearestUniversity,
    int DistanceMinutes,
    SmokingRule SmokingRule,
    GuestsRule GuestsRule,
    IReadOnlyList<AmenityType> Amenities,
    bool? IsActive);
