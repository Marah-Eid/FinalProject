using Dorm.Application.Abstractions;
using Dorm.Application.Common.Exceptions;
using Dorm.Application.DTOs.Auth;
using Dorm.Application.Services.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Dorm.API.Controllers;

[ApiController]
[Route("api/users")]
[Authorize]
public sealed class UsersController(IAuthService auth, ICurrentUser currentUser) : ControllerBase
{
    /// <summary>The authenticated user's own profile.</summary>
    [HttpGet("me")]
    public async Task<ActionResult<UserDto>> GetMe(CancellationToken ct)
    {
        var userId = currentUser.UserId
            ?? throw new UnauthorizedException();
        return Ok(await auth.GetCurrentUserAsync(userId, ct));
    }
}
