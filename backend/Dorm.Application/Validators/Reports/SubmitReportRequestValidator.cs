using Dorm.Application.DTOs.Reports;
using FluentValidation;

namespace Dorm.Application.Validators.Reports;

public sealed class SubmitReportRequestValidator : AbstractValidator<SubmitReportRequest>
{
    public SubmitReportRequestValidator()
    {
        RuleFor(r => r.ApartmentId).NotEmpty();
        RuleFor(r => r.Reason).IsInEnum();
        RuleFor(r => r.Description).MaximumLength(2000);
    }
}
