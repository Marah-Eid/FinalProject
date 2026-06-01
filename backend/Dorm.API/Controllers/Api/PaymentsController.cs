using Dorm.Application.Abstractions;
using Dorm.Application.Common.Exceptions;
using Dorm.Application.DTOs.Payments;
using Dorm.Application.Services.Payments;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Dorm.API.Controllers.Api;

[ApiController]
[Route("api/payments")]
[Authorize]
public sealed class PaymentsController(
    IPaymentsAppService payments,
    ICurrentUser currentUser) : ControllerBase
{
    /// <summary>
    /// Charge the caller for a platform fee (MatchCommission / ListingFee /
    /// VerifiedBadge). Returns the Completed payment record once the mock
    /// gateway responds (~1s in dev).
    /// </summary>
    [HttpPost("checkout")]
    public async Task<ActionResult<PaymentDto>> Checkout(
        [FromBody] CheckoutRequest req, CancellationToken ct)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedException();
        return Ok(await payments.CheckoutAsync(userId, req, ct));
    }

    /// <summary>Confirm a Stripe checkout session after redirect.</summary>
    [HttpPost("confirm")]
    public async Task<ActionResult<PaymentDto>> Confirm(
        [FromBody] ConfirmRequest req, CancellationToken ct)
    {
        var result = await payments.ConfirmSessionAsync(req.SessionId, ct);
        if (result is null) return NotFound();
        return Ok(result);
    }

    /// <summary>The caller's payment history, newest first.</summary>
    [HttpGet("history")]
    public async Task<ActionResult<IReadOnlyList<PaymentDto>>> History(CancellationToken ct)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedException();
        return Ok(await payments.GetHistoryAsync(userId, ct));
    }
}

public sealed record ConfirmRequest(string SessionId);
