using Dorm.Application.DTOs.Apartments;
using FluentValidation;

namespace Dorm.Application.Validators.Apartments;

public sealed class CreateApartmentRequestValidator : AbstractValidator<CreateApartmentRequest>
{
    public CreateApartmentRequestValidator()
    {
        RuleFor(r => r.Title).NotEmpty().MinimumLength(5).MaximumLength(140);
        RuleFor(r => r.Description).NotEmpty().MinimumLength(20).MaximumLength(4000);
        RuleFor(r => r.City).IsInEnum();
        RuleFor(r => r.Neighborhood).NotEmpty().MaximumLength(120);
        RuleFor(r => r.AddressDetail).NotEmpty().MaximumLength(500);

        RuleFor(r => r.Latitude).InclusiveBetween(-90, 90);
        RuleFor(r => r.Longitude).InclusiveBetween(-180, 180);

        RuleFor(r => r.FullRent).GreaterThan(0).LessThanOrEqualTo(99_999_999m);
        RuleFor(r => r.TotalSpots).InclusiveBetween(1, 20);
        RuleFor(r => r.AvailableSpots).GreaterThanOrEqualTo(0)
            .LessThanOrEqualTo(r => r.TotalSpots)
            .WithMessage("AvailableSpots cannot exceed TotalSpots.");

        RuleFor(r => r.GenderType).IsInEnum();
        RuleFor(r => r.NearestUniversity).IsInEnum();
        RuleFor(r => r.DistanceMinutes).InclusiveBetween(0, 240);
        RuleFor(r => r.SmokingRule).IsInEnum();
        RuleFor(r => r.GuestsRule).IsInEnum();

        RuleFor(r => r.Amenities)
            .NotNull()
            .Must(a => a.Distinct().Count() == a.Count)
            .WithMessage("Duplicate amenities are not allowed.");
        RuleForEach(r => r.Amenities).IsInEnum();
    }
}
