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
            }

            return View();
        }
        catch (NotFoundException)
        {
            return NotFound();
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
