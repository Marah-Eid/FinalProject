using Dorm.Application.Abstractions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Dorm.API.Controllers;

/// <summary>
/// Liveness/readiness probe. Returns a small payload so the frontend
/// and ops tooling can verify the API is reachable.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public sealed class HealthController : ControllerBase
{
    [HttpGet]
    public IActionResult Get() => Ok(new
    {
        status = "ok",
        service = "Dorm.API",
        version = "0.1.0",
        timestamp = DateTime.UtcNow
    });

    /// <summary>Diagnostic: echoes what ICurrentUser sees from the inbound request.</summary>
    [HttpGet("whoami")]
    [AllowAnonymous]
    public IActionResult WhoAmI([FromServices] ICurrentUser cu) => Ok(new
    {
        isAuthenticated = cu.IsAuthenticated,
        userId = cu.UserId,
        role = cu.Role?.ToString(),
        gender = cu.Gender?.ToString(),
        email = cu.Email,
    });
}
