using System.Security.Claims;
using Dorm.Application.Abstractions;
using Dorm.Domain.Enums;

namespace Dorm.API.Identity;

/// <summary>
/// Reads the authenticated identity from the active HTTP request's claims.
/// Registered as Scoped so it captures the request's HttpContext at the time of
/// resolution.
/// </summary>
public sealed class CurrentUserService(IHttpContextAccessor accessor) : ICurrentUser
{
    private ClaimsPrincipal? Principal => accessor.HttpContext?.User;

    public bool IsAuthenticated => Principal?.Identity?.IsAuthenticated == true;

    public Guid? UserId
    {
        get
        {
            var raw = Principal?.FindFirstValue(ClaimTypes.NameIdentifier);
            return Guid.TryParse(raw, out var id) ? id : null;
        }
    }

    public UserRole? Role
    {
        get
        {
            var raw = Principal?.FindFirstValue(ClaimTypes.Role);
            return Enum.TryParse<UserRole>(raw, ignoreCase: false, out var role) ? role : null;
        }
    }

    public Gender? Gender
    {
        get
        {
            // The JWT middleware remaps the issued "gender" claim to the long
            // ClaimTypes.Gender URI (http://schemas.xmlsoap.org/.../gender) on
            // the way in. Read both for forward-compatibility.
            var raw = Principal?.FindFirstValue(ClaimTypes.Gender)
                   ?? Principal?.FindFirstValue("gender");
            return Enum.TryParse<Gender>(raw, ignoreCase: false, out var g) ? g : null;
        }
    }

    public string? Email => Principal?.FindFirstValue(ClaimTypes.Email);
}
