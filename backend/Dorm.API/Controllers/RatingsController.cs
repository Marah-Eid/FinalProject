using Dorm.Application.Abstractions;
using Dorm.Application.Common.Exceptions;
using Dorm.Application.DTOs.Ratings;
using Dorm.Application.Services.Ratings;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Dorm.API.Controllers;

[ApiController]
public sealed class RatingsController(
    IRatingService ratings,
    ICurrentUser currentUser) : ControllerBase
{
    /// <summary>Submit a rating for someone you shared an ended tenancy with.</summary>
    [HttpPost("/api/ratings")]
    [Authorize]
    public async Task<ActionResult<RatingDto>> Submit(
        [FromBody] SubmitRatingRequest req, CancellationToken ct)
    {
        var raterId = currentUser.UserId ?? throw new UnauthorizedException();
        return Ok(await ratings.SubmitAsync(raterId, req, ct));
    }

    /// <summary>Public ratings TARGETING the given user.</summary>
    [HttpGet("/api/users/{id:guid}/ratings")]
    [AllowAnonymous]
    public async Task<ActionResult<IReadOnlyList<RatingDto>>> ForUser(Guid id, CancellationToken ct)
        => Ok(await ratings.GetForUserAsync(id, ct));

    /// <summary>
    /// End a tenancy. Either party (student or owner) can call. Frees the spot
    /// up and notifies both sides to leave a rating.
    /// </summary>
    [HttpPut("/api/tenancies/{id:guid}/end")]
    [Authorize]
    public async Task<IActionResult> EndTenancy(Guid id, CancellationToken ct)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedException();
        await ratings.EndTenancyAsync(id, userId, ct);
        return NoContent();
    }
}
