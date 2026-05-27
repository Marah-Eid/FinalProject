using Dorm.Application.DTOs.Auth;
using FluentValidation;

namespace Dorm.Application.Validators.Auth;

public sealed class VerifyUniversityRequestValidator : AbstractValidator<VerifyUniversityRequest>
{
    public VerifyUniversityRequestValidator()
    {
        RuleFor(r => r.UniversityEmail)
            .NotEmpty()
            .EmailAddress()
            .MaximumLength(254);
    }
}
