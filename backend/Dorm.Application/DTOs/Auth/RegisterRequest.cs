using Dorm.Domain.Enums;

namespace Dorm.Application.DTOs.Auth;

public sealed record RegisterRequest(
    string FullName,
    string Email,
    string Password,
    UserRole Role,
    Gender Gender,
    string PhoneNumber,
    University? University);
