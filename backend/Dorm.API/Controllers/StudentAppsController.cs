using Dorm.Application.Abstractions;
using Dorm.Application.Services.Applications;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Dorm.API.Controllers;

[Authorize(Policy = AuthPolicies.Student)]
public class StudentAppsController(
    IApplicationService applications,
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
}
