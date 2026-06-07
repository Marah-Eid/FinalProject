using Dorm.Application.Abstractions;
using Dorm.Application.Services.Applications;
using Dorm.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Dorm.API.Controllers;

[Authorize(Policy = AuthPolicies.Student)]
public class StudentAppsController(
    IApplicationService applications,
    IAppDbContext db,
    ICurrentUser currentUser) : Controller
{
    public async Task<IActionResult> Index(CancellationToken ct)
    {
        ViewData["Title"] = "My Applications";
        var userId = currentUser.UserId!.Value;
        var apps = await applications.GetMineAsync(userId, ct);
        ViewBag.Applications = apps;
        return View();
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Withdraw(Guid id, CancellationToken ct)
    {
        var userId = currentUser.UserId!.Value;
        await applications.WithdrawAsync(id, userId, ct);
        TempData["Success"] = "Application withdrawn.";
        return RedirectToAction("Index");
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> SetMoveInDate(Guid apartmentId, DateTime moveInDate, CancellationToken ct)
    {
        var userId = currentUser.UserId!.Value;
        var tenancy = await db.Tenancies
            .FirstOrDefaultAsync(t => t.StudentId == userId && t.ApartmentId == apartmentId && t.Status == TenancyStatus.Active, ct);
        if (tenancy != null)
        {
            tenancy.PlannedMoveInDate = moveInDate;
            await db.SaveChangesAsync(ct);
        }
        TempData["Success"] = "Move-in date set.";
        return RedirectToAction("Index");
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> ConfirmMoveIn(Guid apartmentId, CancellationToken ct)
    {
        var userId = currentUser.UserId!.Value;
        var tenancy = await db.Tenancies
            .FirstOrDefaultAsync(t => t.StudentId == userId && t.ApartmentId == apartmentId && t.Status == TenancyStatus.Active, ct);
        if (tenancy != null)
        {
            tenancy.MovedInAt = DateTime.UtcNow;
            await db.SaveChangesAsync(ct);
        }
        TempData["Success"] = "Welcome to your new home!";
        return RedirectToAction("Index");
    }
}
