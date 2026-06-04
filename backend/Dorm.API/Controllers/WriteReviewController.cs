using Dorm.Application.Abstractions;
using Dorm.Application.Common.Exceptions;
using Dorm.Application.DTOs.Testimonials;
using Dorm.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Dorm.API.Controllers;

[Authorize]
public class WriteReviewController(IAppDbContext db, ICurrentUser currentUser) : Controller
{
    public IActionResult Index()
    {
        ViewData["Title"] = "Write a Review";
        return View();
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Submit(int stars, string text, CancellationToken ct)
    {
        var userId = currentUser.UserId!.Value;

        if (string.IsNullOrWhiteSpace(text) || text.Length < 10 || text.Length > 500)
        {
            ViewData["Error"] = "Review must be 10–500 characters.";
            return View("Index");
        }
        if (stars < 1 || stars > 5)
        {
            ViewData["Error"] = "Stars must be between 1 and 5.";
            return View("Index");
        }

        var existing = await db.Testimonials.AnyAsync(t => t.UserId == userId, ct);
        if (existing)
        {
            ViewData["Error"] = "You have already submitted a review.";
            return View("Index");
        }

        db.Testimonials.Add(new Testimonial
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Text = text.Trim(),
            Stars = stars,
            IsApproved = false,
            CreatedAt = DateTime.UtcNow,
        });
        await db.SaveChangesAsync(ct);

        TempData["Success"] = "Review submitted! It will appear after admin approval.";
        return RedirectToAction("Index");
    }
}
