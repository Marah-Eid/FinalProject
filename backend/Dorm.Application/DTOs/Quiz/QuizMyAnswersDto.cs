namespace Dorm.Application.DTOs.Quiz;

public sealed record QuizMyAnswersDto(bool QuizCompleted, IReadOnlyList<QuizAnswerDto> Answers);
