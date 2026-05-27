using Dorm.Application.Abstractions;
using Dorm.Application.Common.Exceptions;
using Dorm.Application.DTOs.Admin;
using Dorm.Application.DTOs.Reports;
using Dorm.Application.Services.Admin;
using Dorm.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Dorm.API.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Policy = AuthPolicies.Admin)]
public sealed class AdminController(
    IAdminService admin,
    ICurrentUser currentUser) : ControllerBase
{
    // ── Dashboard ──────────────────────────────────────────────────────────
    [HttpGet("dashboard")]
    public async Task<ActionResult<AdminDashboardDto>> Dashboard(CancellationToken ct)
        => Ok(await admin.GetDashboardAsync(ct));

    // ── Users ──────────────────────────────────────────────────────────────
    [HttpGet("users")]
    public async Task<ActionResult<IReadOnlyList<AdminUserDto>>> Users(
        [FromQuery] string? search,
        [FromQuery] UserRole? role,
        [FromQuery] int take = 50,
        CancellationToken ct = default)
        => Ok(await admin.ListUsersAsync(search, role, take, ct));

    [HttpPut("users/{id:guid}/ban")]
    public async Task<IActionResult> Ban(Guid id, CancellationToken ct)
    {
        await admin.BanUserAsync(id, ct);
        return NoContent();
    }

    [HttpPut("users/{id:guid}/unban")]
    public async Task<IActionResult> Unban(Guid id, CancellationToken ct)
    {
        await admin.UnbanUserAsync(id, ct);
        return NoContent();
    }

    // ── Listings ───────────────────────────────────────────────────────────
    [HttpGet("listings")]
    public async Task<ActionResult<IReadOnlyList<AdminApartmentDto>>> Listings(
        [FromQuery] string? search,
        [FromQuery] bool? suspended,
        [FromQuery] int take = 50,
        CancellationToken ct = default)
        => Ok(await admin.ListApartmentsAsync(search, suspended, take, ct));

    [HttpPut("listings/{id:guid}/suspend")]
    public async Task<IActionResult> Suspend(Guid id, CancellationToken ct)
    {
        await admin.SuspendListingAsync(id, ct);
        return NoContent();
    }

    [HttpPut("listings/{id:guid}/activate")]
    public async Task<IActionResult> Activate(Guid id, CancellationToken ct)
    {
        await admin.ActivateListingAsync(id, ct);
        return NoContent();
    }

    // ── Reports queue ──────────────────────────────────────────────────────
    [HttpGet("reports")]
    public async Task<ActionResult<IReadOnlyList<ReportDto>>> Reports(
        [FromQuery] bool pendingOnly = true,
        [FromQuery] int take = 50,
        CancellationToken ct = default)
        => Ok(await admin.ListReportsAsync(pendingOnly, take, ct));

    [HttpPut("reports/{id:guid}/resolve")]
    public async Task<IActionResult> Resolve(
        Guid id, [FromBody] ResolveReportRequest req, CancellationToken ct)
    {
        var adminId = currentUser.UserId ?? throw new UnauthorizedException();
        await admin.ResolveReportAsync(id, adminId, req, ct);
        return NoContent();
    }
}
