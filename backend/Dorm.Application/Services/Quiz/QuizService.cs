using Dorm.Application.Abstractions;
using Dorm.Application.Common;
using Dorm.Application.Common.Exceptions;
using Dorm.Application.DTOs.Quiz;
using Dorm.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Dorm.Application.Services.Quiz;

public sealed class QuizService(IAppDbContext db) : IQuizService
{
    public QuizQuestionsDto GetQuestions() => new(
        QuizAnswers.AllQuestions
            .Select(key => new QuizQuestionDto(key, QuizAnswers.ByQuestion[key]))
            .ToList());

    public async Task SaveAnswersAsync(Guid studentUserId, SaveQuizAnswersRequest req, CancellationToken ct)
    {
        // Auto-create the StudentProfile on first quiz save. Year + Major are
        // captured later via the profile-update endpoint; defaults are fine.
        var profile = await db.StudentProfiles
            .Include(p => p.QuizAnswers)
            .FirstOrDefaultAsync(p => p.UserId == studentUserId, ct);

        if (profile is null)
        {
            profile = new StudentProfile
            {
                Id = Guid.NewGuid(),
                UserId = studentUserId,
                Major = string.Empty,
                Year = 0,
            };
            db.StudentProfiles.Add(profile);
        }

        // Replace-all semantics — simpler and avoids partial-update ambiguity.
        foreach (var existing in profile.QuizAnswers.ToList())
            db.QuizAnswers.Remove(existing);

        foreach (var ans in req.Answers)
        {
            db.QuizAnswers.Add(new QuizAnswer
            {
                Id = Guid.NewGuid(),
                StudentProfileId = profile.Id,
                QuestionKey = ans.QuestionKey,
                AnswerValue = ans.AnswerValue,
            });
        }

        profile.QuizCompleted = req.Answers.Count == QuizAnswers.AllQuestions.Count;
        await db.SaveChangesAsync(ct);
    }

    public async Task<QuizMyAnswersDto> GetMyAnswersAsync(Guid studentUserId, CancellationToken ct)
    {
        var profile = await db.StudentProfiles
            .AsNoTracking()
            .Include(p => p.QuizAnswers)
            .FirstOrDefaultAsync(p => p.UserId == studentUserId, ct);

        if (profile is null)
            return new QuizMyAnswersDto(QuizCompleted: false, Answers: Array.Empty<QuizAnswerDto>());

        var answers = profile.QuizAnswers
            .OrderBy(a => a.QuestionKey)
            .Select(a => new QuizAnswerDto(a.QuestionKey, a.AnswerValue))
            .ToList();

        return new QuizMyAnswersDto(profile.QuizCompleted, answers);
    }
}
