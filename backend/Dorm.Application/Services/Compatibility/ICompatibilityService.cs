using Dorm.Application.DTOs.Compatibility;
using Dorm.Domain.Enums;

namespace Dorm.Application.Services.Compatibility;

/// <summary>
/// Roommate compatibility scoring — the heart of the app per the brief.
/// All logic is pure: callers materialise the relevant quiz answers and the
/// service does the math, so it stays trivial to unit test.
/// </summary>
public interface ICompatibilityService
{
    /// <summary>
    /// Compute compatibility for a student against the *set* of current tenants
    /// of an apartment. The result is the rounded average of pairwise scores
    /// plus a per-question breakdown.
    ///
    /// • If <paramref name="tenantAnswers"/> is empty → score 100, empty lists.
    /// • If <paramref name="studentAnswers"/> is empty (incomplete quiz) → the
    ///   score is 0 because we have nothing to compare; in practice the caller
    ///   should guard against this case and avoid showing a score.
    /// </summary>
    CompatibilityBreakdownDto Compute(
        IReadOnlyDictionary<QuizQuestionKey, string> studentAnswers,
        IReadOnlyList<IReadOnlyDictionary<QuizQuestionKey, string>> tenantAnswers);

    /// <summary>
    /// Score a student against a single other student (e.g. one tenant). The
    /// detail-page CurrentTenantDto uses this to attach a per-tenant percentage.
    /// </summary>
    int ComputePairwiseScore(
        IReadOnlyDictionary<QuizQuestionKey, string> a,
        IReadOnlyDictionary<QuizQuestionKey, string> b);
}
