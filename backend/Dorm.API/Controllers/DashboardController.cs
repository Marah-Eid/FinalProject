using System.Security.Claims;
using Dorm.Application.Abstractions;
using Dorm.Application.Services.Applications;
using Dorm.Application.Services.Apartments;
using Dorm.Application.Services.Messages;
using Dorm.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Dorm.API.Controllers;

[Authorize]
public class DashboardController(
    IApplicationService applications,
    IApartmentService apartments,
    IMessageService messages,
    ICurrentUser currentUser) : Controller
{
    public async Task<IActionResult> Index(CancellationToken ct)
    {
        ViewData["Title"] = "Dashboard";
        var userId = currentUser.UserId!.Value;
        var role = currentUser.Role!.Value;

        if (role == UserRole.Admin)
            return Redirect("/Admin");

        if (role == UserRole.Student)
            return Redirect("/");

        var convos = await messages.GetConversationsAsync(userId, ct);
        ViewBag.UnreadMessages = convos.Sum(c => c.UnreadCount);

        var listings = await apartments.GetMineAsync(userId, ct);
        var received = await applications.GetReceivedAsync(userId, ct);
        ViewBag.OwnerListings = listings;
        ViewBag.ReceivedApps = received;
        ViewBag.PendingApps = received.Count(a => a.Status == ApplicationStatus.Pending);
        ViewBag.AcceptedApps = received.Count(a => a.Status == ApplicationStatus.Accepted);

        return View();
    }
}
