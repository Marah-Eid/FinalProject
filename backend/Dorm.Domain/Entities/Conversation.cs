namespace Dorm.Domain.Entities;

/// <summary>
/// 1:1 chat between a student and an apartment owner, scoped to a specific apartment.
/// Participant1/2 ordering is arbitrary — the unique index in EF config enforces
/// that there's at most one conversation per (student, owner, apartment) triple.
/// </summary>
public class Conversation
{
    public Guid Id { get; set; }
    public Guid Participant1Id { get; set; }
    public User Participant1 { get; set; } = null!;
    public Guid Participant2Id { get; set; }
    public User Participant2 { get; set; } = null!;
    public Guid ApartmentId { get; set; }
    public Apartment Apartment { get; set; } = null!;

    public DateTime LastMessageAt { get; set; } = DateTime.UtcNow;

    public ICollection<Message> Messages { get; set; } = new List<Message>();
}
