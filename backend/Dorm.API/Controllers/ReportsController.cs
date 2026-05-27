using Dorm.Application.Abstractions;
using Dorm.Application.Common.Exceptions;
using Dorm.Application.DTOs.Reports;
using Dorm.Application.Services.Reports;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Dorm.API.Controllers;

[ApiController]
[Route("api/reports")]
[Authorize]
public sealed class ReportsController(
    IReportService reports,
    ICurrentUser currentUser) : ControllerBase
{
    /// <summary>
    /// Flag a listing. After 3 pending reports the apartment is auto-suspended
    /// and the admin queue picks it up.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<ReportDto>> Submit(
        [FromBody] SubmitReportRequest req, CancellationToken ct)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedException();
        return Ok(await reports.SubmitAsync(userId, req, ct));
    }
}
