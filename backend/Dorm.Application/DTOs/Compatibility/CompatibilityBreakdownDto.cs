using Dorm.Domain.Enums;

namespace Dorm.Application.DTOs.Compatibility;

/// <summary>
/// Returned by <c>GET /api/apartments/{id}/compatibility</c> — the rounded
/// percentage plus a per-question breakdown the frontend uses to render
/// "You match on X" / "You differ on Y" pills.
/// </summary>
/// <param name="Score">Average pairwise score across current tenants, rounded to the nearest int. 100 when there are no current tenants.</param>
/// <param name="MatchedOn">Questions where the student's answer is identical to every current tenant's answer.</param>
/// <param name="DifferedOn">Questions where the student's answer is opposite (distance 2) to at least one tenant's answer.</param>
/// <param name="TenantsCount">Number of active tenants the score was averaged over.</param>
public sealed record CompatibilityBreakdownDto(
    int Score,
    IReadOnlyList<QuizQuestionKey> MatchedOn,
    IReadOnlyList<QuizQuestionKey> DifferedOn,
    int TenantsCount);
