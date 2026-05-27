using Dorm.Application.DTOs.Notifications;
using Dorm.Domain.Enums;

namespace Dorm.Application.Services.Notifications;

public interface INotificationService
{
    /// <summary>
    /// Persist an in-app notification for the given user. Called from other services
    /// (applications, messages, ratings) when something happens that the user should see.
    /// </summary>
    Task CreateAsync(
        Guid userId,
        NotificationType type,
        string title,
        string content,
        Guid? relatedEntityId,
        CancellationToken ct);

    /// <summary>The current user's notifications, newest first. Paginated up to <paramref name="take"/>.</summary>
    Task<IReadOnlyList<NotificationDto>> GetMineAsync(Guid userId, int take, CancellationToken ct);

    /// <summary>Count of unread notifications for the bell badge.</summary>
    Task<int> GetUnreadCountAsync(Guid userId, CancellationToken ct);

    /// <summary>Mark one as read. No-op if it doesn't belong to the user.</summary>
    Task MarkReadAsync(Guid notificationId, Guid userId, CancellationToken ct);

    /// <summary>Mark every unread notification for the user as read.</summary>
    Task MarkAllReadAsync(Guid userId, CancellationToken ct);
}
