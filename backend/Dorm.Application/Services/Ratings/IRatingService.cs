using Dorm.Application.DTOs.Ratings;

namespace Dorm.Application.Services.Ratings;

public interface IRatingService
{
    /// <summary>
    /// Submit a 1–5 star rating between two people who shared an *ended* tenancy
    /// for the given apartment. The rater is either the owner rating an ex-tenant,
    /// or the ex-tenant rating the owner.
    /// </summary>
    Task<RatingDto> SubmitAsync(Guid raterId, SubmitRatingRequest req, CancellationToken ct);

    /// <summary>All ratings *targeting* a given user (their public reputation page).</summary>
    Task<IReadOnlyList<RatingDto>> GetForUserAsync(Guid userId, CancellationToken ct);

    /// <summary>End a tenancy. Either the student or the apartment owner can call.</summary>
    Task EndTenancyAsync(Guid tenancyId, Guid callerId, CancellationToken ct);
}
