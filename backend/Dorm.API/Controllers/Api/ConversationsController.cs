using Dorm.Application.Abstractions;
using Dorm.Application.Common.Exceptions;
using Dorm.Application.DTOs.Messages;
using Dorm.Application.Services.Messages;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Dorm.API.Controllers.Api;

[ApiController]
[Route("api/conversations")]
[Authorize]
public sealed class ConversationsController(
    IMessageService messages,
    ICurrentUser currentUser) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ConversationDto>>> List(CancellationToken ct)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedException();
        return Ok(await messages.GetConversationsAsync(userId, ct));
    }

    /// <summary>
    /// Messages in a conversation, newest first. Use <c>?before=ISO</c> to page
    /// backwards into older messages; the client reverses for rendering.
    /// </summary>
    [HttpGet("{id:guid}/messages")]
    public async Task<ActionResult<IReadOnlyList<MessageDto>>> Messages(
        Guid id,
        [FromQuery] DateTime? before,
        [FromQuery] int take = 50,
        CancellationToken ct = default)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedException();
        return Ok(await messages.GetMessagesAsync(id, userId, before, take, ct));
    }

    [HttpPost("{id:guid}/messages")]
    public async Task<ActionResult<MessageDto>> Send(
        Guid id, [FromBody] SendMessageRequest req, CancellationToken ct)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedException();
        return Ok(await messages.SendMessageAsync(id, userId, req, ct));
    }

    [HttpPut("{id:guid}/read")]
    public async Task<IActionResult> MarkRead(Guid id, CancellationToken ct)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedException();
        await messages.MarkReadAsync(id, userId, ct);
        return NoContent();
    }
}
