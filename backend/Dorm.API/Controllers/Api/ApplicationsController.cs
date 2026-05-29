using Dorm.Application.Abstractions;
using Dorm.Application.Common.Exceptions;
using Dorm.Application.DTOs.Applications;
using Dorm.Application.Services.Applications;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Dorm.API.Controllers.Api;

/// <summary>
/// Applications cover both endpoints under /api/apartments/{id}/apply and the
/// /api/applications/* tree, so we use absolute-route attributes rather than a
/// class-level [Route].
/// </summary>
[ApiController]
public sealed class ApplicationsController(
    IApplicationService applications,
    ICurrentUser currentUser) : ControllerBase
{
    /// <summary>Student applies to a specific apartment with a short message.</summary>
    [HttpPost("/api/apartments/{id:guid}/apply")]
    [Authorize(Policy = AuthPolicies.Student)]
    public async Task<ActionResult<ApplicationDto>> Apply(
        Guid id, [FromBody] ApplyRequest req, CancellationToken ct)
    {
        var studentId = currentUser.UserId ?? throw new UnauthorizedException();
        return Ok(await applications.ApplyAsync(studentId, id, req, ct));
    }

    /// <summary>The student's own applications.</summary>
    [HttpGet("/api/applications/mine")]
    [Authorize(Policy = AuthPolicies.Student)]
    public async Task<ActionResult<IReadOnlyList<ApplicationDto>>> Mine(CancellationToken ct)
    {
        var studentId = currentUser.UserId ?? throw new UnauthorizedException();
        return Ok(await applications.GetMineAsync(studentId, ct));
    }

    /// <summary>Applications received for any apartment the caller owns.</summary>
    [HttpGet("/api/applications/received")]
    [Authorize(Policy = AuthPolicies.Owner)]
    public async Task<ActionResult<IReadOnlyList<ApplicationReceivedDto>>> Received(CancellationToken ct)
    {
        var ownerId = currentUser.UserId ?? throw new UnauthorizedException();
        return Ok(await applications.GetReceivedAsync(ownerId, ct));
    }

    /// <summary>Owner accepts a pending application — triggers Tenancy creation, spots-, notification + email.</summary>
    [HttpPut("/api/applications/{id:guid}/accept")]
    [Authorize(Policy = AuthPolicies.Owner)]
    public async Task<ActionResult<ApplicationDto>> Accept(Guid id, CancellationToken ct)
    {
        var ownerId = currentUser.UserId ?? throw new UnauthorizedException();
        return Ok(await applications.AcceptAsync(id, ownerId, ct));
    }

    /// <summary>Owner rejects a pending application.</summary>
    [HttpPut("/api/applications/{id:guid}/reject")]
    [Authorize(Policy = AuthPolicies.Owner)]
    public async Task<ActionResult<ApplicationDto>> Reject(Guid id, CancellationToken ct)
    {
        var ownerId = currentUser.UserId ?? throw new UnauthorizedException();
        return Ok(await applications.RejectAsync(id, ownerId, ct));
    }

    /// <summary>Student withdraws their own pending application.</summary>
    [HttpDelete("/api/applications/{id:guid}")]
    [Authorize(Policy = AuthPolicies.Student)]
    public async Task<IActionResult> Withdraw(Guid id, CancellationToken ct)
    {
        var studentId = currentUser.UserId ?? throw new UnauthorizedException();
        await applications.WithdrawAsync(id, studentId, ct);
        return NoContent();
    }
}
