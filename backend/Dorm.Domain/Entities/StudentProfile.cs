namespace Dorm.Domain.Entities;

/// <summary>
/// 1-to-1 with <see cref="User"/> when the user's role is Student.
/// Created on demand the first time a student saves quiz answers / completes onboarding.
/// </summary>
public class StudentProfile
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public string? Bio { get; set; }
    /// <summary>Academic year 1–5.</summary>
    public int Year { get; set; }
    public required string Major { get; set; }
    /// <summary>Set to true when all 8 quiz answers have been saved.</summary>
    public bool QuizCompleted { get; set; }

    public ICollection<QuizAnswer> QuizAnswers { get; set; } = new List<QuizAnswer>();
}
