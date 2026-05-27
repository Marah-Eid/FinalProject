using Dorm.Application.DTOs.Auth;
using Dorm.Domain.Enums;
using FluentValidation;

namespace Dorm.Application.Validators.Auth;

public sealed class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
    public RegisterRequestValidator()
    {
        RuleFor(r => r.FullName)
            .NotEmpty()
            .MinimumLength(2)
            .MaximumLength(120);

        RuleFor(r => r.Email)
            .NotEmpty()
            .EmailAddress()
            .MaximumLength(254);

        RuleFor(r => r.Password)
            .NotEmpty()
            .MinimumLength(8).WithMessage("Password must be at least 8 characters.")
            .MaximumLength(128)
            .Matches(@"\d").WithMessage("Password must contain at least one digit.")
            .Matches(@"[A-Za-z]").WithMessage("Password must contain at least one letter.");

        RuleFor(r => r.Role)
            .Must(role => role is UserRole.Student or UserRole.Owner)
            .WithMessage("Role must be Student or Owner.");

        RuleFor(r => r.Gender).IsInEnum();

        RuleFor(r => r.PhoneNumber)
            .NotEmpty()
            .MaximumLength(40)
            .Matches(@"^\+?[0-9\s\-]{6,40}$")
            .WithMessage("Phone number is not in a valid format.");

        When(r => r.University.HasValue, () =>
            RuleFor(r => r.University!.Value).IsInEnum());
    }
}
