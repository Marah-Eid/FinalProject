using Dorm.Application.Common.Exceptions;
using Dorm.Application.DTOs.Auth;
using Dorm.Application.Services.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Dorm.API.Controllers.Api;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(IAuthService auth) : ControllerBase
{
    /// <summary>Create a new student or owner account. Returns access + refresh tokens.</summary>
    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Register([FromBody] RegisterRequest req, CancellationToken ct)
        => Ok(await auth.RegisterAsync(req, ct));

    /// <summary>Email + password login.</summary>
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest req, CancellationToken ct)
        => Ok(await auth.LoginAsync(req, ct));

    /// <summary>Rotate a refresh token for a fresh access+refresh pair.</summary>
    [HttpPost("refresh")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Refresh([FromBody] RefreshRequest req, CancellationToken ct)
        => Ok(await auth.RefreshAsync(req, ct));

    /// <summary>Confirm an account email using the token from the verification email.</summary>
    [HttpPost("verify-email")]
    [AllowAnonymous]
    public async Task<IActionResult> VerifyEmail([FromQuery] string token, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(token))
            throw new BadRequestException("token is required.");
        await auth.VerifyEmailAsync(token, ct);
        return NoContent();
    }

    /// <summary>Request a password reset email. Always responds 204 to avoid leaking which emails are registered.</summary>
    [HttpPost("forgot-password")]
    [AllowAnonymous]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest req, CancellationToken ct)
    {
        await auth.ForgotPasswordAsync(req, ct);
        return NoContent();
    }

    /// <summary>Complete a password reset using the emailed token.</summary>
    [HttpPost("reset-password")]
    [AllowAnonymous]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest req, CancellationToken ct)
    {
        await auth.ResetPasswordAsync(req, ct);
        return NoContent();
    }

    /// <summary>
    /// Student-only: register a second email at a recognised university domain to claim
    /// the "Verified Student" badge. Sends a verification email to that address.
    /// </summary>
    [HttpPost("verify-university")]
    [Authorize(Policy = AuthPolicies.Student)]
    public async Task<IActionResult> RequestUniversityVerification(
        [FromBody] VerifyUniversityRequest req,
        [FromServices] Dorm.Application.Abstractions.ICurrentUser currentUser,
        CancellationToken ct)
    {
        var userId = currentUser.UserId
            ?? throw new UnauthorizedException();
        await auth.RequestUniversityVerificationAsync(userId, req, ct);
        return NoContent();
    }

    /// <summary>Click-through endpoint used by the verification email from /verify-university.</summary>
    [HttpPost("verify-university/confirm")]
    [AllowAnonymous]
    public async Task<IActionResult> ConfirmUniversityVerification([FromQuery] string token, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(token))
            throw new BadRequestException("token is required.");
        await auth.ConfirmUniversityVerificationAsync(token, ct);
        return NoContent();
    }
}
