using Dorm.Application.Abstractions;
using Dorm.Domain.Entities;
using Dorm.Domain.Enums;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Dorm.API.Controllers;

public class ContactController(IAppDbContext db) : Controller
{
    public IActionResult Index() => RedirectToAction("Index", "About");

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Send(string name, string email, string subject, string message, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(name) || string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(message))
        {
            TempData["Error"] = "Please fill in all required fields.";
            return RedirectToAction("Index", "About");
        }

        var admin = await db.Users.AsNoTracking()
            .FirstOrDefaultAsync(u => u.Role == UserRole.Admin, ct);

        if (admin != null)
        {
            db.Notifications.Add(new Notification
            {
                Id = Guid.NewGuid(),
                UserId = admin.Id,
                Type = NotificationType.ContactMessage,
                Title = $"Contact: {subject ?? "General Inquiry"} — {name}",
                Content = $"From: {name} ({email})\n\n{message}",
                IsRead = false,
                CreatedAt = DateTime.UtcNow,
            });
            await db.SaveChangesAsync(ct);
        }

        TempData["Success"] = "true";
        return RedirectToAction("Index", "About");
    }
}
