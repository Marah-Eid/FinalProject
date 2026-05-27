using Dorm.Domain.Enums;

namespace Dorm.Application.Abstractions;

/// <summary>
/// Reads the authenticated identity from the current request (JWT claims).
/// Implementation lives in the API project where HttpContext is available.
/// </summary>
public interface ICurrentUser
{
    bool IsAuthenticated { get; }
    Guid? UserId { get; }
    UserRole? Role { get; }
    Gender? Gender { get; }
    string? Email { get; }
}
