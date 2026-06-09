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
    public async Task<IActionResult> Index(CancellationToken ct)
    {
        ViewData["Title"] = "Write a Review";
        var userId = currentUser.UserId!.Value;
        var existing = await db.Testimonials.AsNoTracking()
            .FirstOrDefaultAsync(t => t.UserId == userId, ct);
        ViewBag.AlreadySubmitted = existing is not null;
        ViewBag.IsApproved = existing?.IsApproved ?? false;
        return View();
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Submit(int stars, string? text, CancellationToken ct)
    {
        try
        {
            var userId = currentUser.UserId!.Value;

            if (stars < 1 || stars > 5)
            {
                ViewData["Error"] = "Please select a rating (1-5 stars).";
                return View("Index");
            }
            if (string.IsNullOrWhiteSpace(text) || text.Length < 10 || text.Length > 500)
            {
                ViewData["Error"] = "Review must be 10–500 characters.";
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
        catch (Exception)
        {
            ViewData["Error"] = "Something went wrong. Try logging out and back in.";
            return View("Index");
        }
    }
}
