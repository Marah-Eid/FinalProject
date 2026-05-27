using Dorm.Application.DTOs.Quiz;

namespace Dorm.Application.Services.Quiz;

public interface IQuizService
{
    /// <summary>The 8 questions + their allowed answer strings. Pure data; safe to cache.</summary>
    QuizQuestionsDto GetQuestions();

    /// <summary>
    /// Replace the current student's saved answers with the supplied set. Auto-creates a
    /// StudentProfile if the user doesn't have one yet. Sets QuizCompleted=true on the
    /// profile when the request contains a complete set (all 8 questions).
    /// </summary>
    Task SaveAnswersAsync(Guid studentUserId, SaveQuizAnswersRequest req, CancellationToken ct);

    /// <summary>Read the current student's saved answers + completion flag.</summary>
    Task<QuizMyAnswersDto> GetMyAnswersAsync(Guid studentUserId, CancellationToken ct);
}
