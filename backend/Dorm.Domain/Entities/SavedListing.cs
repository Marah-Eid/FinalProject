namespace Dorm.Domain.Entities;

/// <summary>One row per heart/save by a student. Unique on (StudentId, ApartmentId).</summary>
public class SavedListing
{
    public Guid Id { get; set; }
    public Guid StudentId { get; set; }
    public User Student { get; set; } = null!;
    public Guid ApartmentId { get; set; }
    public Apartment Apartment { get; set; } = null!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
