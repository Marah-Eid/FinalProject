using Dorm.Domain.Enums;

namespace Dorm.Application.DTOs.Auth;

/// <summary>
/// Public-shape user record returned on /api/users/me and embedded in AuthResponse.
/// Sensitive fields (PasswordHash, token hashes) are intentionally absent.
/// PhoneNumber is included here only for the user's own profile lookup — endpoints
/// that return other users' profiles must omit it unless the requester has an
/// accepted application.
/// </summary>
public sealed record UserDto(
    Guid Id,
    string FullName,
    string Email,
    string PhoneNumber,
    UserRole Role,
    Gender Gender,
    bool IsEmailVerified,
    bool IsUniversityVerified,
    string? ProfilePhotoUrl,
    University? University,
    DateTime CreatedAt,
    bool IsPhoneVerified = false,
    string? IdDocumentUrl = null,
    bool IsIdVerified = false);
