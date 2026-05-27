using Dorm.Application.Abstractions;
using Dorm.Application.Common.Exceptions;
using Dorm.Application.DTOs.Payments;
using Dorm.Application.Services.Payments;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Dorm.API.Controllers;

[ApiController]
[Route("api/payments")]
[Authorize]
public sealed class PaymentsController(
    IPaymentsAppService payments,
    ICurrentUser currentUser) : ControllerBase
{
    /// <summary>
    /// Charge the caller for a platform fee (MatchCommission / FeaturedListing /
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

    /// <summary>The caller's payment history, newest first.</summary>
    [HttpGet("history")]
    public async Task<ActionResult<IReadOnlyList<PaymentDto>>> History(CancellationToken ct)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedException();
        return Ok(await payments.GetHistoryAsync(userId, ct));
    }
}
