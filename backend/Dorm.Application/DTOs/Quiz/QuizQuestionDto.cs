using Dorm.Domain.Enums;

namespace Dorm.Application.DTOs.Quiz;

/// <summary>One quiz question — key + the allowed answer-value strings.</summary>
public sealed record QuizQuestionDto(QuizQuestionKey Key, IReadOnlyList<string> Options);

public sealed record QuizQuestionsDto(IReadOnlyList<QuizQuestionDto> Questions);
