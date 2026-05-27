using Dorm.Application.Abstractions;
using Dorm.Application.DTOs.Notifications;
using Dorm.Domain.Entities;
using Dorm.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Dorm.Application.Services.Notifications;

public sealed class NotificationService(IAppDbContext db) : INotificationService
{
    public async Task CreateAsync(
        Guid userId,
        NotificationType type,
        string title,
        string content,
        Guid? relatedEntityId,
        CancellationToken ct)
    {
        db.Notifications.Add(new Notification
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Type = type,
            Title = title,
            Content = content,
            IsRead = false,
            RelatedEntityId = relatedEntityId,
            CreatedAt = DateTime.UtcNow,
        });
        await db.SaveChangesAsync(ct);
    }

    public async Task<IReadOnlyList<NotificationDto>> GetMineAsync(Guid userId, int take, CancellationToken ct)
    {
        take = Math.Clamp(take, 1, 100);
        return await db.Notifications
            .AsNoTracking()
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .Take(take)
            .Select(n => new NotificationDto(
                n.Id, n.Type, n.Title, n.Content, n.IsRead, n.RelatedEntityId, n.CreatedAt))
            .ToListAsync(ct);
    }

    public Task<int> GetUnreadCountAsync(Guid userId, CancellationToken ct) =>
        db.Notifications.AsNoTracking().CountAsync(n => n.UserId == userId && !n.IsRead, ct);

    public async Task MarkReadAsync(Guid notificationId, Guid userId, CancellationToken ct)
    {
        // Guarded UPDATE — only updates if the row belongs to the caller and is unread.
        await db.Notifications
            .Where(n => n.Id == notificationId && n.UserId == userId && !n.IsRead)
            .ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true), ct);
    }

    public async Task MarkAllReadAsync(Guid userId, CancellationToken ct)
    {
        await db.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true), ct);
    }
}
