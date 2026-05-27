using Dorm.Domain.Enums;

namespace Dorm.Domain.Entities;

/// <summary>
/// One row per (student, question). AnswerValue is a constant string like
/// "EarlyBird" / "VeryTidy" / "Outside" — the canonical values are defined
/// in the Application layer (QuizAnswers constants).
/// </summary>
public class QuizAnswer
{
    public Guid Id { get; set; }
    public Guid StudentProfileId { get; set; }
    public StudentProfile StudentProfile { get; set; } = null!;

    public QuizQuestionKey QuestionKey { get; set; }
    public required string AnswerValue { get; set; }
}
