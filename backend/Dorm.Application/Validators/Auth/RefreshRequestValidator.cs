using Dorm.Application.DTOs.Auth;
using FluentValidation;

namespace Dorm.Application.Validators.Auth;

public sealed class RefreshRequestValidator : AbstractValidator<RefreshRequest>
{
    public RefreshRequestValidator()
    {
        RuleFor(r => r.RefreshToken).NotEmpty();
    }
}
