using Dorm.Application.DTOs.Messages;
using FluentValidation;

namespace Dorm.Application.Validators.Messages;

public sealed class SendMessageRequestValidator : AbstractValidator<SendMessageRequest>
{
    public SendMessageRequestValidator()
    {
        RuleFor(r => r.Content)
            .NotEmpty()
            .MaximumLength(4000);
    }
}
