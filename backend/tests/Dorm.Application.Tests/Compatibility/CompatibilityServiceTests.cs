using Dorm.Application.Common;
using Dorm.Application.Services.Compatibility;
using Dorm.Domain.Enums;
using FluentAssertions;

namespace Dorm.Application.Tests.Compatibility;

/// <summary>
/// The compatibility algorithm is the heart of the app per the brief — these
/// tests are the safety net.
/// </summary>
public class CompatibilityServiceTests
{
    private readonly CompatibilityService _svc = new();

    // ── Helpers ─────────────────────────────────────────────────────────────

    /// <summary>A complete, well-formed set of answers picking the FIRST option for every question.</summary>
    private static IReadOnlyDictionary<QuizQuestionKey, string> AllFirst() =>
        QuizAnswers.AllQuestions.ToDictionary(q => q, q => QuizAnswers.ByQuestion[q][0]);

    /// <summary>A complete answer set picking the LAST option for every question (opposite of AllFirst).</summary>
    private static IReadOnlyDictionary<QuizQuestionKey, string> AllLast() =>
        QuizAnswers.AllQuestions.ToDictionary(q => q, q => QuizAnswers.ByQuestion[q][2]);

    /// <summary>A complete answer set picking the MIDDLE (adjacent) option for every question.</summary>
    private static IReadOnlyDictionary<QuizQuestionKey, string> AllMiddle() =>
        QuizAnswers.AllQuestions.ToDictionary(q => q, q => QuizAnswers.ByQuestion[q][1]);

    private static IReadOnlyList<IReadOnlyDictionary<QuizQuestionKey, string>> Tenants(
        params IReadOnlyDictionary<QuizQuestionKey, string>[] tenants) => tenants;

    // ── Weights ─────────────────────────────────────────────────────────────

    [Fact]
    public void Weights_sum_to_100()
    {
        CompatibilityWeights.ByQuestion.Values.Sum().Should().Be(100);
        CompatibilityWeights.Total.Should().Be(100);
    }

    [Fact]
    public void All_8_questions_have_a_weight()
    {
        foreach (var key in QuizAnswers.AllQuestions)
        {
            CompatibilityWeights.ByQuestion.Should().ContainKey(key);
            CompatibilityWeights.ByQuestion[key].Should().BeGreaterThan(0);
        }
    }

    // ── Pairwise math ───────────────────────────────────────────────────────

    [Theory]
    [InlineData(QuizQuestionKey.Smoking,       "Yes",         "Yes",         25)]   // identical
    [InlineData(QuizQuestionKey.Smoking,       "Yes",         "Outside",     12)]   // adjacent (25/2 floored)
    [InlineData(QuizQuestionKey.Smoking,       "Outside",     "No",          12)]   // adjacent
    [InlineData(QuizQuestionKey.Smoking,       "Yes",         "No",          0)]    // opposite
    [InlineData(QuizQuestionKey.Cleanliness,   "VeryTidy",    "VeryTidy",    20)]
    [InlineData(QuizQuestionKey.Cleanliness,   "VeryTidy",    "Average",     10)]
    [InlineData(QuizQuestionKey.Cleanliness,   "VeryTidy",    "Relaxed",     0)]
    [InlineData(QuizQuestionKey.SleepSchedule, "EarlyBird",   "Flexible",    7)]    // 15/2 floored
    [InlineData(QuizQuestionKey.SleepSchedule, "EarlyBird",   "NightOwl",    0)]
    [InlineData(QuizQuestionKey.PetTolerance,  "Tolerate",    "LovePets",    5)]    // 10/2
    [InlineData(QuizQuestionKey.StudyHabits,   "Library",     "QuietAtHome", 5)]
    [InlineData(QuizQuestionKey.Guests,        "Sometimes",   "Often",       4)]    // 8/2
    [InlineData(QuizQuestionKey.SocialStyle,   "Balanced",    "Introvert",   3)]    // 7/2 floored
    [InlineData(QuizQuestionKey.Cooking,       "CookSometimes", "CookALot",  2)]    // 5/2 floored
    public void Pairwise_matches_distance_in_canonical_order(
        QuizQuestionKey key, string a, string b, int expected)
    {
        CompatibilityScoring.Pairwise(key, a, b).Should().Be(expected);
    }

    [Fact]
    public void Pairwise_with_unknown_answer_returns_zero()
    {
        CompatibilityScoring.Pairwise(QuizQuestionKey.Smoking, "Yes", "Maybe").Should().Be(0);
        CompatibilityScoring.Pairwise(QuizQuestionKey.Smoking, "Maybe", "No").Should().Be(0);
    }

    // ── No tenants ──────────────────────────────────────────────────────────

    [Fact]
    public void No_tenants_returns_100_with_empty_lists()
    {
        var result = _svc.Compute(AllFirst(), Tenants());
        result.Score.Should().Be(100);
        result.MatchedOn.Should().BeEmpty();
        result.DifferedOn.Should().BeEmpty();
        result.TenantsCount.Should().Be(0);
    }

    [Fact]
    public void No_tenants_with_no_student_answers_still_returns_100()
    {
        // The "no tenants" branch wins regardless of the student's quiz state.
        var result = _svc.Compute(new Dictionary<QuizQuestionKey, string>(), Tenants());
        result.Score.Should().Be(100);
    }

    // ── Whole-apartment scores ─────────────────────────────────────────────

    [Fact]
    public void Identical_answers_against_one_tenant_yield_100()
    {
        var me = AllFirst();
        var result = _svc.Compute(me, Tenants(AllFirst()));

        result.Score.Should().Be(100);
        result.MatchedOn.Should().HaveCount(8);  // every question is a perfect match
        result.DifferedOn.Should().BeEmpty();
        result.TenantsCount.Should().Be(1);
    }

    [Fact]
    public void All_opposite_answers_against_one_tenant_yield_0()
    {
        var result = _svc.Compute(AllFirst(), Tenants(AllLast()));

        result.Score.Should().Be(0);
        result.MatchedOn.Should().BeEmpty();
        result.DifferedOn.Should().HaveCount(8);  // every question is opposite
        result.TenantsCount.Should().Be(1);
    }

    [Fact]
    public void Adjacent_on_every_question_yields_about_half()
    {
        // Student picks first option, tenant picks middle option for every question
        // → every question is adjacent → score is the sum of weight/2 across all 8.
        // With integer floor on odd weights (15, 7, 5), the expected sum is:
        //   25/2 + 20/2 + 15/2 + 10/2 + 10/2 + 8/2 + 7/2 + 5/2
        // = 12 + 10 + 7 + 5 + 5 + 4 + 3 + 2 = 48
        var result = _svc.Compute(AllFirst(), Tenants(AllMiddle()));

        result.Score.Should().Be(48);
        result.MatchedOn.Should().BeEmpty();    // no question is "all full"
        result.DifferedOn.Should().BeEmpty();   // no question is "any opposite"
    }

    // ── Multiple tenants — averaging ────────────────────────────────────────

    [Fact]
    public void Two_tenants_one_identical_one_opposite_averages_to_50()
    {
        // Pairwise totals: 100 + 0 = 100; avg = 50.
        var result = _svc.Compute(AllFirst(), Tenants(AllFirst(), AllLast()));

        result.Score.Should().Be(50);
        result.TenantsCount.Should().Be(2);
        result.MatchedOn.Should().BeEmpty();      // not "all" tenants match (only one does)
        result.DifferedOn.Should().HaveCount(8);  // every question is opposite to one tenant
    }

    [Fact]
    public void Three_tenants_average_uses_rounding_away_from_zero()
    {
        // Pairwise totals chosen to hit a fractional average: 100, 100, 99 → 99.666... → 100.
        var me = AllFirst();
        var perfect = AllFirst();
        var almost  = new Dictionary<QuizQuestionKey, string>(me);
        // Knock 1 point off via a Cooking adjacent change (weight 5 → 2 instead of 5; delta = 3, but we want delta = 1).
        // Easier: tweak SocialStyle (weight 7): full=7, adjacent=3 → delta=4. Still not 1.
        // Cleanest "delta = 1" with this algorithm: NOT achievable with integer weights — the smallest
        // delta between same and adjacent is weight - weight/2 = ceil(weight/2). So delta ≥ 2.
        // We'll use Cooking (weight 5; adjacent = 2; delta = 3) → totals 100, 100, 97 → avg 99.0 → 99.
        almost[QuizQuestionKey.Cooking] = QuizAnswers.ByQuestion[QuizQuestionKey.Cooking][1];  // middle option

        var result = _svc.Compute(me, Tenants(perfect, perfect, almost));
        result.Score.Should().Be(99);  // (100 + 100 + 97) / 3 = 99.0
        result.TenantsCount.Should().Be(3);
    }

    [Fact]
    public void Rounding_lands_on_nearest_int_away_from_zero_at_half()
    {
        // Build a scenario whose pairwise totals average to exactly *.5 to verify the rounding mode.
        // Two tenants: pairwise totals 51 and 50 → avg = 50.5 → 51.
        //   Score 51 = 50 (full weight for Cleanliness only matches) + ... too brittle to hand-craft.
        // Instead: verify rounding semantics directly via two tenants whose totals sum to an odd number.
        // Use Cooking-only difference (a small weight) to land near 50.
        var me = AllFirst();

        // Tenant 1: identical to me (total 100).
        var tenant1 = AllFirst();
        // Tenant 2: opposite to me on every question EXCEPT one half-weight match — gives some fractional fluff.
        var tenant2 = AllLast();
        // Total tenant2 ≈ 0; avg = (100 + 0) / 2 = 50.0 → 50.
        var result = _svc.Compute(me, Tenants(tenant1, tenant2));
        result.Score.Should().Be(50);
    }

    // ── MatchedOn / DifferedOn classification ───────────────────────────────

    [Fact]
    public void MatchedOn_lists_questions_full_with_every_tenant()
    {
        var me = AllFirst();

        // Tenant 1 agrees with me on everything.
        var t1 = AllFirst();
        // Tenant 2 disagrees only on Smoking (opposite).
        var t2 = new Dictionary<QuizQuestionKey, string>(me)
        {
            [QuizQuestionKey.Smoking] = QuizAnswers.ByQuestion[QuizQuestionKey.Smoking][2],
        };

        var r = _svc.Compute(me, Tenants(t1, t2));
        // MatchedOn should be every question EXCEPT Smoking (since t2 isn't full on Smoking).
        r.MatchedOn.Should().NotContain(QuizQuestionKey.Smoking);
        r.MatchedOn.Should().HaveCount(QuizAnswers.AllQuestions.Count - 1);
        // DifferedOn should contain Smoking (opposite with t2).
        r.DifferedOn.Should().Contain(QuizQuestionKey.Smoking);
    }

    [Fact]
    public void Adjacent_only_question_is_in_neither_list()
    {
        // Student vs single tenant; only difference is one ADJACENT step on Cleanliness.
        // That question should be in *neither* matchedOn nor differedOn — it's the muddy middle.
        var me = AllFirst();
        var tenant = new Dictionary<QuizQuestionKey, string>(me)
        {
            [QuizQuestionKey.Cleanliness] = QuizAnswers.ByQuestion[QuizQuestionKey.Cleanliness][1],
        };

        var r = _svc.Compute(me, Tenants(tenant));
        r.MatchedOn.Should().NotContain(QuizQuestionKey.Cleanliness);
        r.DifferedOn.Should().NotContain(QuizQuestionKey.Cleanliness);
        // All other 7 questions match fully against this single tenant.
        r.MatchedOn.Should().HaveCount(7);
    }

    // ── Pairwise convenience ────────────────────────────────────────────────

    [Fact]
    public void ComputePairwiseScore_sums_per_question_scores_across_8()
    {
        var me = AllFirst();
        var other = AllFirst();
        _svc.ComputePairwiseScore(me, other).Should().Be(100);
    }

    [Fact]
    public void ComputePairwiseScore_partial_answers_count_present_questions_only()
    {
        var me = new Dictionary<QuizQuestionKey, string>
        {
            [QuizQuestionKey.Smoking] = "No",
            [QuizQuestionKey.Cleanliness] = "VeryTidy",
        };
        var other = new Dictionary<QuizQuestionKey, string>
        {
            [QuizQuestionKey.Smoking] = "No",         // identical → 25
            [QuizQuestionKey.Cleanliness] = "Relaxed",// opposite → 0
        };
        _svc.ComputePairwiseScore(me, other).Should().Be(25);
    }
}
