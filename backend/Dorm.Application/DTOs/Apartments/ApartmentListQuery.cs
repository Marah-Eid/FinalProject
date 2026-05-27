using Dorm.Domain.Enums;

namespace Dorm.Application.DTOs.Apartments;

/// <summary>Browse-page filters + sort + pagination.</summary>
public sealed class ApartmentListQuery
{
    public City? City { get; init; }
    public string? Neighborhood { get; init; }
    public University? University { get; init; }
    public decimal? MinPrice { get; init; }
    public decimal? MaxPrice { get; init; }
    /// <summary>1, 2, 3 — or 4 meaning "4 or more spots".</summary>
    public int? SpotsAvailable { get; init; }
    public bool? Furnished { get; init; }
    public IReadOnlyList<AmenityType>? Amenities { get; init; }
    public int? MaxDistance { get; init; }

    /// <summary>"newest" (default), "price_asc", "price_desc", "highest_match" (Phase 5).</summary>
    public string? Sort { get; init; }

    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 20;
}
