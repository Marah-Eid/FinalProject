using Dorm.Domain.Enums;

namespace Dorm.Application.DTOs.Quiz;

public sealed record QuizAnswerDto(QuizQuestionKey QuestionKey, string AnswerValue);
