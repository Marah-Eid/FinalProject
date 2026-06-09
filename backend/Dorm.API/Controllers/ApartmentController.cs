using Dorm.Application.Abstractions;
using Dorm.Application.Common.Exceptions;
using Dorm.Application.DTOs.Applications;
using Dorm.Application.DTOs.Reports;
using Dorm.Application.Services.Apartments;
using Dorm.Application.Services.Applications;
using Dorm.Application.Services.Reports;
using Dorm.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Dorm.API.Controllers;

public class ApartmentController(
    IApartmentService apartments,
    IApplicationService applications,
    IReportService reports,
    ICurrentUser currentUser,
    IAppDbContext db) : Controller
{
    [AllowAnonymous]
    public async Task<IActionResult> Detail(Guid id, CancellationToken ct)
    {
        try
        {
            var apt = await apartments.GetByIdAsync(id, ct);
            ViewData["Title"] = apt.Title;
            ViewBag.Apartment = apt;

            if (currentUser.IsAuthenticated && currentUser.Role == Domain.Enums.UserRole.Student)
            {
                try
                {
                    var compat = await apartments.GetCompatibilityForStudentAsync(id, currentUser.UserId!.Value, ct);
                    ViewBag.Compatibility = compat;
                }
                catch { }

                var isSaved = await db.SavedListings
                    .AnyAsync(s => s.StudentId == currentUser.UserId!.Value && s.ApartmentId == id, ct);
                ViewBag.IsSaved = isSaved;

                // Check if this student is an accepted tenant (eligible to review)
                var isTenant = await db.Applications.AnyAsync(
                    a => a.ApartmentId == id && a.StudentId == currentUser.UserId!.Value
                      && a.Status == Domain.Enums.ApplicationStatus.Accepted, ct);
                ViewBag.IsTenant = isTenant;

                // Check if they already reviewed
                if (isTenant)
                {
                    ViewBag.AlreadyReviewed = await db.Ratings.AnyAsync(
                        r => r.ApartmentId == id && r.RaterId == currentUser.UserId!.Value, ct);
                }
            }

            // Load reviews for this apartment
            var reviews = await db.Ratings
                .AsNoTracking()
                .Where(r => r.ApartmentId == id)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new {
                    r.Id,
                    RaterName = r.Rater != null ? r.Rater.FullName : "Anonymous",
                    r.Stars,
                    r.Comment,
                    r.CreatedAt
                })
                .ToListAsync(ct);
            ViewBag.Reviews = reviews;
            ViewBag.AvgRating = reviews.Count > 0 ? reviews.Average(r => r.Stars) : (double?)null;

            return View();
        }
        catch (NotFoundException)
        {
            return NotFound();
        }
        catch (OperationCanceledException)
        {
            return StatusCode(499);
        }
        catch (Exception ex)
        {
            return StatusCode(500, "Something went wrong loading this apartment.");
        }
    }

    [HttpPost]
    [Authorize(Policy = AuthPolicies.Student)]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Apply(Guid id, string message, CancellationToken ct)
    {
        var studentId = currentUser.UserId!.Value;
        try
        {
            await applications.ApplyAsync(studentId, id, new ApplyRequest(message ?? ""), ct);
            TempData["Success"] = "Application submitted successfully!";
        }
        catch (BadRequestException ex)
        {
            TempData["Error"] = ex.Message;
        }
        catch (ConflictException ex)
        {
            TempData["Error"] = ex.Message;
        }
        catch (ForbiddenException ex)
        {
            TempData["Error"] = ex.Message;
        }
        return RedirectToAction("Detail", new { id });
    }

    [HttpPost]
    [Authorize]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Report(Guid id, Domain.Enums.ReportReason reason, string? description, CancellationToken ct)
    {
        var userId = currentUser.UserId!.Value;
        await reports.SubmitAsync(userId, new SubmitReportRequest(id, reason, description), ct);
        TempData["Success"] = "Report submitted.";
        return RedirectToAction("Detail", new { id });
    }

    [HttpPost]
    [Authorize(Policy = AuthPolicies.Student)]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> SubmitReview(Guid id, int stars, string? comment, CancellationToken ct)
    {
        var studentId = currentUser.UserId!.Value;

        // Must be an accepted tenant
        var isTenant = await db.Applications.AnyAsync(
            a => a.ApartmentId == id && a.StudentId == studentId
              && a.Status == Domain.Enums.ApplicationStatus.Accepted, ct);
        if (!isTenant)
        {
            TempData["Error"] = "Only accepted tenants can leave a review.";
            return RedirectToAction("Detail", new { id });
        }

        // One review per apartment
        var existing = await db.Ratings.AnyAsync(
            r => r.ApartmentId == id && r.RaterId == studentId, ct);
        if (existing)
        {
            TempData["Error"] = "You have already reviewed this apartment.";
            return RedirectToAction("Detail", new { id });
        }

        if (stars < 1 || stars > 5)
        {
            TempData["Error"] = "Please select a rating between 1 and 5 stars.";
            return RedirectToAction("Detail", new { id });
        }

        var apt = await db.Apartments.AsNoTracking().FirstOrDefaultAsync(a => a.Id == id, ct);
        if (apt is null) return NotFound();

        db.Ratings.Add(new Rating
        {
            Id = Guid.NewGuid(),
            RaterId = studentId,
            RatedUserId = apt.OwnerId,
            ApartmentId = id,
            Stars = stars,
            Comment = string.IsNullOrWhiteSpace(comment) ? null : comment.Trim(),
            CreatedAt = DateTime.UtcNow,
        });
        await db.SaveChangesAsync(ct);

        TempData["Success"] = "Thank you for your review!";
        return RedirectToAction("Detail", new { id });
    }

    [HttpPost]
    [Authorize(Policy = AuthPolicies.Student)]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> ToggleSave(Guid id, CancellationToken ct)
    {
        var userId = currentUser.UserId!.Value;
        var existing = await db.SavedListings
            .FirstOrDefaultAsync(s => s.StudentId == userId && s.ApartmentId == id, ct);

        if (existing != null)
        {
            db.SavedListings.Remove(existing);
        }
        else
        {
            db.SavedListings.Add(new SavedListing
            {
                Id = Guid.NewGuid(),
                StudentId = userId,
                ApartmentId = id,
                CreatedAt = DateTime.UtcNow,
            });
        }
        await db.SaveChangesAsync(ct);
        return RedirectToAction("Detail", new { id });
    }
}
