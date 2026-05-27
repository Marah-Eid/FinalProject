using Dorm.Application.DTOs.Auth;
using FluentValidation;

namespace Dorm.Application.Validators.Auth;

public sealed class ResetPasswordRequestValidator : AbstractValidator<ResetPasswordRequest>
{
    public ResetPasswordRequestValidator()
    {
        RuleFor(r => r.Token).NotEmpty();
        RuleFor(r => r.NewPassword)
            .NotEmpty()
            .MinimumLength(8).WithMessage("Password must be at least 8 characters.")
            .MaximumLength(128)
            .Matches(@"\d").WithMessage("Password must contain at least one digit.")
            .Matches(@"[A-Za-z]").WithMessage("Password must contain at least one letter.");
    }
}
