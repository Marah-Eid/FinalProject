using Dorm.Domain.Enums;

namespace Dorm.Application.Common;

/// <summary>
/// The full list of allowed answer values per quiz question. The compatibility
/// algorithm in Phase 5 will use this table for adjacency lookups too — keep
/// the canonical strings in sync there.
/// </summary>
public static class QuizAnswers
{
    // Order matters: CompatibilityScoring uses the array index to compute
    // distance between two answers. The MIDDLE option (the conciliatory /
    // flexible / "sometimes" answer) must sit at index 1 so it scores as
    // adjacent to both ends, and the two polarised ends sit at indices 0 and 2
    // so their pairwise distance is 2 and they score as opposite.
    public static readonly IReadOnlyDictionary<QuizQuestionKey, IReadOnlyList<string>> ByQuestion =
        new Dictionary<QuizQuestionKey, IReadOnlyList<string>>
        {
            [QuizQuestionKey.SleepSchedule] = new[] { "EarlyBird",   "Flexible",      "NightOwl"     },
            [QuizQuestionKey.Cleanliness]   = new[] { "VeryTidy",    "Average",       "Relaxed"      },
            [QuizQuestionKey.Smoking]       = new[] { "Yes",         "Outside",       "No"           },
            [QuizQuestionKey.StudyHabits]   = new[] { "QuietAtHome", "Library",       "GroupAtHome"  },
            [QuizQuestionKey.SocialStyle]   = new[] { "Introvert",   "Balanced",      "Extrovert"    },
            [QuizQuestionKey.Guests]        = new[] { "Often",       "Sometimes",     "Rarely"       },
            [QuizQuestionKey.Cooking]       = new[] { "CookALot",    "CookSometimes", "MostlyEatOut" },
            [QuizQuestionKey.PetTolerance]  = new[] { "LovePets",    "Tolerate",      "PreferNoPets" },
        };

    /// <summary>True if <paramref name="value"/> is one of the allowed answers for the question.</summary>
    public static bool IsValid(QuizQuestionKey key, string value) =>
        ByQuestion.TryGetValue(key, out var options) && options.Contains(value, StringComparer.Ordinal);

    /// <summary>Canonical list of question keys, in the brief's display order.</summary>
    public static readonly IReadOnlyList<QuizQuestionKey> AllQuestions =
        new[]
        {
            QuizQuestionKey.SleepSchedule,
            QuizQuestionKey.Cleanliness,
            QuizQuestionKey.Smoking,
            QuizQuestionKey.StudyHabits,
            QuizQuestionKey.SocialStyle,
            QuizQuestionKey.Guests,
            QuizQuestionKey.Cooking,
            QuizQuestionKey.PetTolerance,
        };
}
