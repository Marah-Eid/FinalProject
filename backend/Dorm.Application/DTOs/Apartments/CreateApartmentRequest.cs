using Dorm.Domain.Enums;

namespace Dorm.Application.DTOs.Apartments;

public sealed record CreateApartmentRequest(
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
    IReadOnlyList<AmenityType> Amenities);
