namespace Dorm.Application.DTOs.Quiz;

public sealed record SaveQuizAnswersRequest(IReadOnlyList<QuizAnswerDto> Answers);
