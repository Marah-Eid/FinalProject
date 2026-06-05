using Dorm.Application.Abstractions;
using Dorm.Application.DTOs.Admin;
using Dorm.Application.DTOs.Testimonials;
using Dorm.Application.Services.Admin;
using Dorm.Domain.Entities;
using Dorm.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Dorm.API.Areas.Admin.Controllers;

[Area("Admin")]
[Route("Admin")]
[Authorize(Policy = AuthPolicies.Admin)]
public class AdminController(
    IAdminService admin,
    IAppDbContext db,
    ICurrentUser currentUser) : Controller
{
    public async Task<IActionResult> Index(CancellationToken ct)
    {
        ViewData["Title"] = "Admin Panel";
        var dashboard = await admin.GetDashboardAsync(ct);
        var users = await admin.ListUsersAsync(null, null, 50, ct);
        var listings = await admin.ListApartmentsAsync(null, null, 50, ct);
        var reports = await admin.ListReportsAsync(true, 50, ct);
        var testimonials = await db.Testimonials
            .AsNoTracking()
            .Include(t => t.User)
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => new TestimonialDto(
                t.Id, t.User.FullName, t.User.Role.ToString(),
                t.Stars, t.Text, t.IsApproved, t.CreatedAt))
            .ToListAsync(ct);

        ViewBag.Dashboard = dashboard;
        ViewBag.Users = users;
        ViewBag.Listings = listings;
        ViewBag.Reports = reports;
        ViewBag.Testimonials = testimonials;
        return View();
    }

    [HttpPost("Ban/{id}")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Ban(Guid id, CancellationToken ct)
    {
        await admin.BanUserAsync(id, ct);
        TempData["Success"] = "User banned.";
        return Redirect("/Admin#users");
    }

    [HttpPost("Unban/{id}")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Unban(Guid id, CancellationToken ct)
    {
        await admin.UnbanUserAsync(id, ct);
        TempData["Success"] = "User unbanned.";
        return Redirect("/Admin#users");
    }

    [HttpPost("Suspend/{id}")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Suspend(Guid id, CancellationToken ct)
    {
        await admin.SuspendListingAsync(id, ct);
        TempData["Success"] = "Listing suspended.";
        return Redirect("/Admin#listings");
    }

    [HttpPost("Activate/{id}")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Activate(Guid id, CancellationToken ct)
    {
        await admin.ActivateListingAsync(id, ct);
        TempData["Success"] = "Listing activated.";
        return Redirect("/Admin#listings");
    }

    [HttpPost("Resolve/{id}")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Resolve(Guid id, bool dismiss, CancellationToken ct)
    {
        var adminId = currentUser.UserId!.Value;
        await admin.ResolveReportAsync(id, adminId, new ResolveReportRequest(dismiss), ct);
        TempData["Success"] = dismiss ? "Report dismissed." : "Report resolved.";
        return Redirect("/Admin#reports");
    }

    [HttpPost("ApproveTestimonial/{id}")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> ApproveTestimonial(Guid id, CancellationToken ct)
    {
        var t = await db.Testimonials.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (t != null)
        {
            t.IsApproved = true;
            await db.SaveChangesAsync(ct);
        }
        TempData["Success"] = "Testimonial approved.";
        return Redirect("/Admin#testimonials");
    }

    [HttpPost("DeleteTestimonial/{id}")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> DeleteTestimonial(Guid id, CancellationToken ct)
    {
        var t = await db.Testimonials.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (t != null)
        {
            db.Testimonials.Remove(t);
            await db.SaveChangesAsync(ct);
        }
        TempData["Success"] = "Testimonial deleted.";
        return Redirect("/Admin#testimonials");
    }
}
