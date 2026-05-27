using Dorm.Domain.Enums;

namespace Dorm.Domain.Entities;

/// <summary>Junction row — one per (apartment, amenity).</summary>
public class ApartmentAmenity
{
    public Guid Id { get; set; }
    public Guid ApartmentId { get; set; }
    public Apartment Apartment { get; set; } = null!;
    public AmenityType AmenityType { get; set; }
}
