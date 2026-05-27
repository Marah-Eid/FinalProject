using Dorm.Domain.Enums;

namespace Dorm.Application.Common;

/// <summary>
/// Per-question weights for the roommate compatibility algorithm. The brief
/// fixes these values — they sum to 100 — and the algorithm awards
///   • the full weight when two students give the same answer,
///   • half the weight when their answers are adjacent in the canonical order
///     defined by <see cref="QuizAnswers.ByQuestion"/>,
///   • zero when they're at opposite ends.
/// </summary>
public static class CompatibilityWeights
{
    public static readonly IReadOnlyDictionary<QuizQuestionKey, int> ByQuestion =
        new Dictionary<QuizQuestionKey, int>
        {
            [QuizQuestionKey.Smoking]       = 25,
            [QuizQuestionKey.Cleanliness]   = 20,
            [QuizQuestionKey.SleepSchedule] = 15,
            [QuizQuestionKey.PetTolerance]  = 10,
            [QuizQuestionKey.StudyHabits]   = 10,
            [QuizQuestionKey.Guests]        = 8,
            [QuizQuestionKey.SocialStyle]   = 7,
            [QuizQuestionKey.Cooking]       = 5,
        };

    /// <summary>Total of all weights — equals 100 by construction; asserted in the static ctor.</summary>
    public const int Total = 100;

    static CompatibilityWeights()
    {
        var sum = ByQuestion.Values.Sum();
        if (sum != Total)
            throw new InvalidOperationException(
                $"CompatibilityWeights must sum to {Total}; currently sums to {sum}. " +
                "Update ByQuestion so the totals match the brief.");

        foreach (var key in QuizAnswers.AllQuestions)
        {
            if (!ByQuestion.ContainsKey(key))
                throw new InvalidOperationException(
                    $"CompatibilityWeights is missing a weight for {key}. " +
                    "Every QuizQuestionKey must be weighted.");
        }
    }
}
