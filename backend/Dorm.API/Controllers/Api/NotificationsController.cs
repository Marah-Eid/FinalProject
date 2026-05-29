using Dorm.Application.Abstractions;
using Dorm.Application.Common.Exceptions;
using Dorm.Application.DTOs.Notifications;
using Dorm.Application.Services.Notifications;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Dorm.API.Controllers.Api;

[ApiController]
[Route("api/notifications")]
[Authorize]
public sealed class NotificationsController(
    INotificationService notifications,
    ICurrentUser currentUser) : ControllerBase
{
    /// <summary>The caller's most recent in-app notifications. Used by the navbar bell.</summary>
    [HttpGet]
    public async Task<ActionResult<object>> List([FromQuery] int take = 30, CancellationToken ct = default)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedException();
        var items = await notifications.GetMineAsync(userId, take, ct);
        var unread = await notifications.GetUnreadCountAsync(userId, ct);
        return Ok(new { items, unread });
    }

    [HttpPut("{id:guid}/read")]
    public async Task<IActionResult> MarkRead(Guid id, CancellationToken ct)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedException();
        await notifications.MarkReadAsync(id, userId, ct);
        return NoContent();
    }

    [HttpPut("read-all")]
    public async Task<IActionResult> MarkAllRead(CancellationToken ct)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedException();
        await notifications.MarkAllReadAsync(userId, ct);
        return NoContent();
    }
}
