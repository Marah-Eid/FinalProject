using Dorm.Application.Common;
using Dorm.Application.DTOs.Compatibility;
using Dorm.Domain.Enums;

namespace Dorm.Application.Services.Compatibility;

public sealed class CompatibilityService : ICompatibilityService
{
    public CompatibilityBreakdownDto Compute(
        IReadOnlyDictionary<QuizQuestionKey, string> studentAnswers,
        IReadOnlyList<IReadOnlyDictionary<QuizQuestionKey, string>> tenantAnswers)
    {
        // Brief: "If the apartment has no current tenants, return 100% (no roommates to clash with)."
        if (tenantAnswers.Count == 0)
        {
            return new CompatibilityBreakdownDto(
                Score: 100,
                MatchedOn: Array.Empty<QuizQuestionKey>(),
                DifferedOn: Array.Empty<QuizQuestionKey>(),
                TenantsCount: 0);
        }

        // 1) Pairwise total per tenant = sum of per-question scores (0..weight) across the 8 questions.
        //    The student's missing-answer case yields 0 contribution from that question — that's the safest
        //    floor when the quiz isn't complete (the caller is expected to gate the UI on quizCompleted).
        var pairwiseTotals = new int[tenantAnswers.Count];
        for (var t = 0; t < tenantAnswers.Count; t++)
        {
            var tenant = tenantAnswers[t];
            var total = 0;
            foreach (var key in QuizAnswers.AllQuestions)
            {
                if (!studentAnswers.TryGetValue(key, out var s)) continue;
                if (!tenant.TryGetValue(key, out var o)) continue;
                total += CompatibilityScoring.Pairwise(key, s, o);
            }
            pairwiseTotals[t] = total;
        }

        // 2) Apartment score = average of pairwise totals (each already in 0..100), rounded.
        var avg = pairwiseTotals.Average();
        var score = (int)Math.Round(avg, MidpointRounding.AwayFromZero);

        // 3) Per-question classification.
        //    MatchedOn: student's answer is identical to every tenant's answer for this question.
        //    DifferedOn: student's answer is opposite (distance 2 → score 0) for at least one tenant.
        //    (Adjacent / half-weight cases land in neither — they're the muddy middle.)
        var matched = new List<QuizQuestionKey>();
        var differed = new List<QuizQuestionKey>();

        foreach (var key in QuizAnswers.AllQuestions)
        {
            if (!studentAnswers.TryGetValue(key, out var studentA)) continue;

            var weight = CompatibilityWeights.ByQuestion[key];
            var allFull = true;
            var anyOpposite = false;

            foreach (var tenant in tenantAnswers)
            {
                if (!tenant.TryGetValue(key, out var tenantA)) { allFull = false; continue; }
                var s = CompatibilityScoring.Pairwise(key, studentA, tenantA);
                if (s != weight) allFull = false;
                if (s == 0) anyOpposite = true;
            }

            if (allFull) matched.Add(key);
            if (anyOpposite) differed.Add(key);
        }

        return new CompatibilityBreakdownDto(score, matched, differed, tenantAnswers.Count);
    }

    public int ComputePairwiseScore(
        IReadOnlyDictionary<QuizQuestionKey, string> a,
        IReadOnlyDictionary<QuizQuestionKey, string> b)
    {
        var total = 0;
        foreach (var key in QuizAnswers.AllQuestions)
        {
            if (!a.TryGetValue(key, out var ans1)) continue;
            if (!b.TryGetValue(key, out var ans2)) continue;
            total += CompatibilityScoring.Pairwise(key, ans1, ans2);
        }
        return total;
    }
}
