using Dorm.Domain.Enums;

namespace Dorm.Application.DTOs.Notifications;

public sealed record NotificationDto(
    Guid Id,
    NotificationType Type,
    string Title,
    string Content,
    bool IsRead,
    Guid? RelatedEntityId,
    DateTime CreatedAt);
