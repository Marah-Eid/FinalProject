using Dorm.Domain.Enums;

namespace Dorm.Application.Common;

/// <summary>
/// Pure functions for computing the per-question score between two answers.
/// All callers go through <see cref="CompatibilityService"/>, but this is the
/// math that's directly exercised by the unit tests.
/// </summary>
public static class CompatibilityScoring
{
    /// <summary>
    /// Score this single question for a pair of answers, in [0, weight].
    /// Returns 0 if either answer is not in the canonical option list — that's
    /// the safe default for an unknown answer string from the wire.
    /// </summary>
    public static int Pairwise(QuizQuestionKey key, string answerA, string answerB)
    {
        var weight = CompatibilityWeights.ByQuestion[key];

        // Identical answers always score full weight. Fast-path and also
        // sidesteps a missing-option lookup for hypothetical future answers.
        if (string.Equals(answerA, answerB, StringComparison.Ordinal))
            return weight;

        var options = QuizAnswers.ByQuestion[key];
        int ia = -1, ib = -1;
        for (var i = 0; i < options.Count; i++)
        {
            if (options[i] == answerA) ia = i;
            if (options[i] == answerB) ib = i;
        }
        if (ia < 0 || ib < 0) return 0;  // unknown answer → safest is 0

        var distance = Math.Abs(ia - ib);
        return distance switch
        {
            0 => weight,         // unreachable since the equality check above handles it; kept for clarity
            1 => weight / 2,     // adjacent → half (integer math is intentional: weights are even or odd by design)
            _ => 0,              // distance >= 2 → opposite
        };
    }
}
