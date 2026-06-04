using Dorm.Application.Abstractions;
using Dorm.Application.DTOs.Payments;
using Dorm.Application.Services.Payments;
using Dorm.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Dorm.API.Controllers;

[Authorize]
public class PaymentController(
    IPaymentsAppService payments,
    ICurrentUser currentUser) : Controller
{
    public async Task<IActionResult> Index(CancellationToken ct)
    {
        ViewData["Title"] = "Payments";
        var userId = currentUser.UserId!.Value;
        var history = await payments.GetHistoryAsync(userId, ct);
        ViewBag.Payments = history;
        return View();
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Checkout(PaymentType type, Guid? relatedEntityId, CancellationToken ct)
    {
        var userId = currentUser.UserId!.Value;
        var result = await payments.CheckoutAsync(userId, new CheckoutRequest(type, relatedEntityId), ct);

        if (!string.IsNullOrEmpty(result.CheckoutUrl))
            return Redirect(result.CheckoutUrl);

        TempData["Success"] = "Payment completed.";
        return RedirectToAction("Index");
    }

    public async Task<IActionResult> Success(string? session_id, CancellationToken ct)
    {
        ViewData["Title"] = "Payment Successful";
        if (!string.IsNullOrEmpty(session_id))
        {
            var result = await payments.ConfirmSessionAsync(session_id, ct);
            ViewBag.Payment = result;
        }
        return View();
    }
}
