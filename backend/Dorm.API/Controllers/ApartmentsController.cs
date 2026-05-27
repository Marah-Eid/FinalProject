using Dorm.Application.Abstractions;
using Dorm.Application.Common;
using Dorm.Application.Common.Exceptions;
using Dorm.Application.DTOs.Apartments;
using Dorm.Application.DTOs.Compatibility;
using Dorm.Application.Services.Apartments;
using Dorm.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Dorm.API.Controllers;

[ApiController]
[Route("api/apartments")]
public sealed class ApartmentsController(
    IApartmentService apartments,
    ICurrentUser currentUser) : ControllerBase
{
    // ── Public browse + detail ──────────────────────────────────────────────

    /// <summary>
    /// Paginated browse list. For logged-in students the response is automatically
    /// filtered to apartments matching their gender (MaleOnly+Mixed or
    /// FemaleOnly+Mixed). Anonymous and Owner callers see everything matching the
    /// other filters.
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<PaginatedResult<ApartmentListItemDto>>> List(
        [FromQuery] City? city,
        [FromQuery] string? neighborhood,
        [FromQuery] University? university,
        [FromQuery] decimal? minPrice,
        [FromQuery] decimal? maxPrice,
        [FromQuery] int? spotsAvailable,
        [FromQuery] bool? furnished,
        [FromQuery(Name = "amenities")] AmenityType[]? amenities,
        [FromQuery] int? maxDistance,
        [FromQuery] string? sort,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var query = new ApartmentListQuery
        {
            City = city,
            Neighborhood = neighborhood,
            University = university,
            MinPrice = minPrice,
            MaxPrice = maxPrice,
            SpotsAvailable = spotsAvailable,
            Furnished = furnished,
            Amenities = amenities,
            MaxDistance = maxDistance,
            Sort = sort,
            Page = page,
            PageSize = pageSize,
        };
        return Ok(await apartments.GetListAsync(query, ct));
    }

    /// <summary>
    /// Detail page. Returns 404 if the gender filter excludes it.
    /// Address and owner phone fields are NULL unless the caller is the owner or
    /// has an Accepted application for this apartment.
    /// </summary>
    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<ActionResult<ApartmentDetailDto>> GetById(Guid id, CancellationToken ct)
        => Ok(await apartments.GetByIdAsync(id, ct));

    /// <summary>Every listing the calling owner owns — drives the "My listings" page.</summary>
    [HttpGet("mine")]
    [Authorize(Policy = AuthPolicies.Owner)]
    public async Task<ActionResult<IReadOnlyList<ApartmentListItemDto>>> Mine(CancellationToken ct)
    {
        var ownerId = currentUser.UserId ?? throw new UnauthorizedException();
        return Ok(await apartments.GetMineAsync(ownerId, ct));
    }

    /// <summary>
    /// Compatibility breakdown — rounded average score + matched-on / differed-on lists.
    /// Students only; the student must have a complete quiz.
    /// </summary>
    [HttpGet("{id:guid}/compatibility")]
    [Authorize(Policy = AuthPolicies.Student)]
    public async Task<ActionResult<CompatibilityBreakdownDto>> GetCompatibility(
        Guid id, CancellationToken ct)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedException();
        return Ok(await apartments.GetCompatibilityForStudentAsync(id, userId, ct));
    }

    // ── Owner CRUD ──────────────────────────────────────────────────────────

    [HttpPost]
    [Authorize(Policy = AuthPolicies.Owner)]
    public async Task<ActionResult<ApartmentDetailDto>> Create(
        [FromBody] CreateApartmentRequest req,
        CancellationToken ct)
    {
        var ownerId = currentUser.UserId ?? throw new UnauthorizedException();
        var created = await apartments.CreateAsync(ownerId, req, ct);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = AuthPolicies.Owner)]
    public async Task<ActionResult<ApartmentDetailDto>> Update(
        Guid id,
        [FromBody] UpdateApartmentRequest req,
        CancellationToken ct)
    {
        var ownerId = currentUser.UserId ?? throw new UnauthorizedException();
        return Ok(await apartments.UpdateAsync(id, ownerId, req, ct));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = AuthPolicies.Owner)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var ownerId = currentUser.UserId ?? throw new UnauthorizedException();
        await apartments.DeleteAsync(id, ownerId, ct);
        return NoContent();
    }

    // ── Owner photo upload ──────────────────────────────────────────────────

    /// <summary>Upload one photo (jpg/png/webp, max ~5 MB) for an apartment.</summary>
    [HttpPost("{id:guid}/photos")]
    [Authorize(Policy = AuthPolicies.Owner)]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(10_485_760)]  // 10 MB request envelope (the file inside is capped to 5 MB by the service).
    public async Task<ActionResult<ApartmentPhotoDto>> UploadPhoto(
        Guid id,
        IFormFile file,
        CancellationToken ct)
    {
        if (file is null || file.Length == 0)
            throw new BadRequestException("A file is required.");

        var ownerId = currentUser.UserId ?? throw new UnauthorizedException();

        await using var stream = file.OpenReadStream();
        var photo = await apartments.UploadPhotoAsync(
            id, ownerId, stream, file.FileName, file.ContentType, ct);
        return Ok(photo);
    }

    [HttpDelete("{id:guid}/photos/{photoId:guid}")]
    [Authorize(Policy = AuthPolicies.Owner)]
    public async Task<IActionResult> DeletePhoto(Guid id, Guid photoId, CancellationToken ct)
    {
        var ownerId = currentUser.UserId ?? throw new UnauthorizedException();
        await apartments.DeletePhotoAsync(id, photoId, ownerId, ct);
        return NoContent();
    }
}
