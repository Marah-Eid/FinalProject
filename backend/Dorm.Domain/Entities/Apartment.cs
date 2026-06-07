using Dorm.Domain.Enums;

namespace Dorm.Domain.Entities;

public class Apartment
{
    public Guid Id { get; set; }
    public Guid OwnerId { get; set; }
    public User Owner { get; set; } = null!;

    public required string Title { get; set; }
    public required string Description { get; set; }
    public City City { get; set; }
    public required string Neighborhood { get; set; }
    /// <summary>Street-level address. Hidden from API responses until the requesting student has an Accepted application.</summary>
    public required string AddressDetail { get; set; }

    public double Latitude { get; set; }
    public double Longitude { get; set; }

    /// <summary>Full monthly rent in JOD (entire apartment).</summary>
    public decimal FullRent { get; set; }
    public int TotalSpots { get; set; }
    public int AvailableSpots { get; set; }

    public GenderType GenderType { get; set; }
    public bool IsFurnished { get; set; }
    public University NearestUniversity { get; set; }
    public DistanceRange DistanceRange { get; set; }
    public SmokingRule SmokingRule { get; set; }
    public GuestsRule GuestsRule { get; set; }

    public bool IsActive { get; set; } = true;
    public bool IsSuspended { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<ApartmentAmenity> Amenities { get; set; } = new List<ApartmentAmenity>();
    public ICollection<ApartmentPhoto> Photos { get; set; } = new List<ApartmentPhoto>();
    public ICollection<Tenancy> Tenancies { get; set; } = new List<Tenancy>();
    public ICollection<Application> Applications { get; set; } = new List<Application>();
}
