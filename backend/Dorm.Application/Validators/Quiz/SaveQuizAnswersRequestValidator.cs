using Dorm.Application.Common;
using Dorm.Application.DTOs.Quiz;
using FluentValidation;

namespace Dorm.Application.Validators.Quiz;

public sealed class SaveQuizAnswersRequestValidator : AbstractValidator<SaveQuizAnswersRequest>
{
    public SaveQuizAnswersRequestValidator()
    {
        RuleFor(r => r.Answers)
            .NotNull()
            .Must(a => a.Count == QuizAnswers.AllQuestions.Count)
            .WithMessage($"Provide answers for all {QuizAnswers.AllQuestions.Count} questions.")
            .Must(a => a.Select(x => x.QuestionKey).Distinct().Count() == a.Count)
            .WithMessage("Duplicate question keys are not allowed.");

        RuleForEach(r => r.Answers).ChildRules(a =>
        {
            a.RuleFor(x => x.QuestionKey).IsInEnum();
            a.RuleFor(x => x.AnswerValue)
                .NotEmpty()
                .Must((parent, value) => QuizAnswers.IsValid(parent.QuestionKey, value))
                .WithMessage("Answer value is not valid for the given question.");
        });
    }
}
