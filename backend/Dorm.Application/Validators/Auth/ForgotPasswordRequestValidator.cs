using Dorm.Application.DTOs.Auth;
using FluentValidation;

namespace Dorm.Application.Validators.Auth;

public sealed class ForgotPasswordRequestValidator : AbstractValidator<ForgotPasswordRequest>
{
    public ForgotPasswordRequestValidator()
    {
        RuleFor(r => r.Email).NotEmpty().EmailAddress().MaximumLength(254);
    }
}
