namespace Dorm.Domain.Enums;

/// <summary>
/// The 8 lifestyle quiz questions. Weights for the compatibility algorithm
/// are defined in CompatibilityWeights (Application layer) — keep this enum
/// in sync with that table.
/// </summary>
public enum QuizQuestionKey
{
    SleepSchedule = 0,
    Cleanliness = 1,
    Smoking = 2,
    StudyHabits = 3,
    SocialStyle = 4,
    Guests = 5,
    Cooking = 6,
    PetTolerance = 7,
}
