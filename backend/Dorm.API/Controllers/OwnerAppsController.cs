using Dorm.Application.Abstractions;
using Dorm.Application.Services.Applications;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Dorm.API.Controllers;

[Authorize(Policy = AuthPolicies.Owner)]
public class OwnerAppsController(
    IApplicationService applications,
    ICurrentUser currentUser) : Controller
{
    public async Task<IActionResult> Index(CancellationToken ct)
    {
        ViewData["Title"] = "Applications Received";
        var ownerId = currentUser.UserId!.Value;
        var received = await applications.GetReceivedAsync(ownerId, ct);
        ViewBag.Applications = received;
        return View();
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Accept(Guid id, CancellationToken ct)
    {
        var ownerId = currentUser.UserId!.Value;
        await applications.AcceptAsync(id, ownerId, ct);
        TempData["Success"] = "Application accepted!";
        return RedirectToAction("Index");
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Reject(Guid id, CancellationToken ct)
    {
        var ownerId = currentUser.UserId!.Value;
        await applications.RejectAsync(id, ownerId, ct);
        TempData["Success"] = "Application rejected.";
        return RedirectToAction("Index");
    }
}
