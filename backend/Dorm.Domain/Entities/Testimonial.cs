namespace Dorm.Domain.Entities;

public class Testimonial
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public string Text { get; set; } = string.Empty;
    public int Stars { get; set; }
    public bool IsApproved { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
