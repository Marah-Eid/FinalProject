namespace Dorm.Application.DTOs.Auth;

/// <summary>Returned by register / login / refresh.</summary>
public sealed record AuthResponse(
    string AccessToken,
    DateTime AccessTokenExpiresAt,
    string RefreshToken,
    DateTime RefreshTokenExpiresAt,
    UserDto User);
