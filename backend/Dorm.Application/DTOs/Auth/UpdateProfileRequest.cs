using Dorm.Domain.Enums;

namespace Dorm.Application.DTOs.Auth;

public sealed record UpdateProfileRequest(
    string? FullName,
    string? PhoneNumber,
    University? University);
