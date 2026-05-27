namespace Dorm.Domain.Entities;

/// <summary>
/// 1–5 star rating left by one party against another, scoped to an apartment.
/// Only allowed after the tenancy has ended.
/// </summary>
public class Rating
{
    public Guid Id { get; set; }
    public Guid RaterId { get; set; }
    public User Rater { get; set; } = null!;
    public Guid RatedUserId { get; set; }
    public User RatedUser { get; set; } = null!;
    public Guid ApartmentId { get; set; }
    public Apartment Apartment { get; set; } = null!;

    public int Stars { get; set; }
    public string? Comment { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
