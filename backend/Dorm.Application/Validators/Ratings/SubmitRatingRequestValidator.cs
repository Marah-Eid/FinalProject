using Dorm.Application.DTOs.Ratings;
using FluentValidation;

namespace Dorm.Application.Validators.Ratings;

public sealed class SubmitRatingRequestValidator : AbstractValidator<SubmitRatingRequest>
{
    public SubmitRatingRequestValidator()
    {
        RuleFor(r => r.RatedUserId).NotEmpty();
        RuleFor(r => r.ApartmentId).NotEmpty();
        RuleFor(r => r.Stars).InclusiveBetween(1, 5);
        RuleFor(r => r.Comment).MaximumLength(1000);
    }
}
