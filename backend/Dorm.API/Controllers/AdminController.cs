using Dorm.Application.Abstractions;
using Dorm.Application.DTOs.Admin;
using Dorm.Application.DTOs.Testimonials;
using Dorm.Application.Services.Admin;
using Dorm.Domain.Entities;
using Dorm.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Dorm.API.Controllers;

[Authorize(Policy = AuthPolicies.Admin)]
public class AdminPageController(
    IAdminService admin,
    IAppDbContext db,
    ICurrentUser currentUser) : Controller
{
    [Route("Admin")]
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
        return View("~/Views/Admin/Index.cshtml");
    }

    [HttpPost("Admin/Users/{id}/Ban")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Ban(Guid id, CancellationToken ct)
    {
        await admin.BanUserAsync(id, ct);
        TempData["Success"] = "User banned.";
        return Redirect("/Admin#users");
    }

    [HttpPost("Admin/Users/{id}/Unban")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Unban(Guid id, CancellationToken ct)
    {
        await admin.UnbanUserAsync(id, ct);
        TempData["Success"] = "User unbanned.";
        return Redirect("/Admin#users");
    }

    [HttpPost("Admin/Listings/{id}/Suspend")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Suspend(Guid id, CancellationToken ct)
    {
        await admin.SuspendListingAsync(id, ct);
        TempData["Success"] = "Listing suspended.";
        return Redirect("/Admin#listings");
    }

    [HttpPost("Admin/Listings/{id}/Activate")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Activate(Guid id, CancellationToken ct)
    {
        await admin.ActivateListingAsync(id, ct);
        TempData["Success"] = "Listing activated.";
        return Redirect("/Admin#listings");
    }

    [HttpPost("Admin/Reports/{id}/Resolve")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Resolve(Guid id, bool dismiss, CancellationToken ct)
    {
        var adminId = currentUser.UserId!.Value;
        await admin.ResolveReportAsync(id, adminId, new ResolveReportRequest(dismiss), ct);
        TempData["Success"] = dismiss ? "Report dismissed." : "Report resolved.";
        return Redirect("/Admin#reports");
    }

    [HttpPost("Admin/Testimonials/{id}/Approve")]
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

    [HttpPost("Admin/Testimonials/{id}/Delete")]
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
