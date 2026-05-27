using Dorm.Application.DTOs.Auth;
using FluentValidation;

namespace Dorm.Application.Validators.Auth;

public sealed class LoginRequestValidator : AbstractValidator<LoginRequest>
{
    public LoginRequestValidator()
    {
        RuleFor(r => r.Email).NotEmpty().EmailAddress();
        RuleFor(r => r.Password).NotEmpty();
    }
}
