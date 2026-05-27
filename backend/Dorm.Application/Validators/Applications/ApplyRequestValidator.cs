using Dorm.Application.DTOs.Applications;
using FluentValidation;

namespace Dorm.Application.Validators.Applications;

public sealed class ApplyRequestValidator : AbstractValidator<ApplyRequest>
{
    public ApplyRequestValidator()
    {
        RuleFor(r => r.Message)
            .NotEmpty()
            .MinimumLength(20).WithMessage("Message must be at least 20 characters.")
            .MaximumLength(500).WithMessage("Message must be 500 characters or fewer.");
    }
}
