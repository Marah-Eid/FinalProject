using Dorm.Domain.Enums;

namespace Dorm.Domain.Entities;

/// <summary>
/// In-app notification. The bell in the navbar polls this table.
/// RelatedEntityId is optionally the id of the application / message / rating /
/// listing the notification points to — interpretation depends on Type.
/// </summary>
public class Notification
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public NotificationType Type { get; set; }
    public required string Title { get; set; }
    public required string Content { get; set; }
    public bool IsRead { get; set; }
    public Guid? RelatedEntityId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
