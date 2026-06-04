using Dorm.Application.Abstractions;
using Dorm.Application.DTOs.Messages;
using Dorm.Application.Services.Messages;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Dorm.API.Controllers;

[Authorize]
public class ChatController(
    IMessageService messages,
    ICurrentUser currentUser) : Controller
{
    public async Task<IActionResult> Index(CancellationToken ct)
    {
        ViewData["Title"] = "Messages";
        var userId = currentUser.UserId!.Value;
        var conversations = await messages.GetConversationsAsync(userId, ct);
        ViewBag.Conversations = conversations;
        return View();
    }

    [Route("Chat/{id:guid}")]
    public async Task<IActionResult> Conversation(Guid id, CancellationToken ct)
    {
        ViewData["Title"] = "Messages";
        ViewData["ConversationId"] = id;
        var userId = currentUser.UserId!.Value;
        var conversations = await messages.GetConversationsAsync(userId, ct);
        var msgs = await messages.GetMessagesAsync(id, userId, null, 50, ct);
        await messages.MarkReadAsync(id, userId, ct);
        ViewBag.Conversations = conversations;
        ViewBag.Messages = msgs;
        ViewBag.CurrentUserId = userId;
        return View();
    }

    [HttpPost("Chat/{id:guid}/Send")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Send(Guid id, string content, CancellationToken ct)
    {
        var userId = currentUser.UserId!.Value;
        await messages.SendMessageAsync(id, userId, new SendMessageRequest(content), ct);
        return RedirectToAction("Conversation", new { id });
    }

    [HttpGet("Chat/{id:guid}/Messages")]
    public async Task<IActionResult> GetMessages(Guid id, DateTime? before, int take = 50, CancellationToken ct = default)
    {
        var userId = currentUser.UserId!.Value;
        var msgs = await messages.GetMessagesAsync(id, userId, before, take, ct);
        return Json(msgs);
    }
}
