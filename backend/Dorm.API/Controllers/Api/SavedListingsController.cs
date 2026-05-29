using Dorm.Application.Abstractions;
using Dorm.Application.Common.Exceptions;
using Dorm.Domain.Entities;
using Dorm.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Dorm.API.Controllers.Api;

[ApiController]
[Route("api/saved")]
[Authorize]
public sealed class SavedListingsController(IAppDbContext db, ICurrentUser currentUser) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetMySaved(CancellationToken ct)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedException();

        var items = await db.SavedListings
            .AsNoTracking()
            .Where(s => s.StudentId == userId)
            .Include(s => s.Apartment)
            .OrderByDescending(s => s.CreatedAt)
            .Select(s => new
            {
                s.Id,
                s.ApartmentId,
                s.Apartment.Title,
                s.Apartment.City,
                s.Apartment.Neighborhood,
                s.Apartment.FullRent,
                s.Apartment.TotalSpots,
                s.Apartment.AvailableSpots,
                s.Apartment.GenderType,
                s.Apartment.IsFurnished,
                s.Apartment.NearestUniversity,
                MainPhotoUrl = s.Apartment.Photos.OrderBy(p => p.DisplayOrder).Select(p => p.PhotoUrl).FirstOrDefault(),
                SavedAt = s.CreatedAt,
            })
            .ToListAsync(ct);

        return Ok(items);
    }

    [HttpGet("ids")]
    public async Task<IActionResult> GetSavedIds(CancellationToken ct)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedException();

        var ids = await db.SavedListings
            .AsNoTracking()
            .Where(s => s.StudentId == userId)
            .Select(s => s.ApartmentId)
            .ToListAsync(ct);

        return Ok(ids);
    }

    [HttpPost("{apartmentId:guid}")]
    public async Task<IActionResult> Toggle(Guid apartmentId, CancellationToken ct)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedException();

        var existing = await db.SavedListings
            .FirstOrDefaultAsync(s => s.StudentId == userId && s.ApartmentId == apartmentId, ct);

        if (existing != null)
        {
            db.SavedListings.Remove(existing);
            await db.SaveChangesAsync(ct);
            return Ok(new { saved = false });
        }

        var apartment = await db.Apartments
            .AnyAsync(a => a.Id == apartmentId && a.IsActive && !a.IsSuspended, ct);
        if (!apartment)
            throw new NotFoundException("Apartment not found.");

        db.SavedListings.Add(new SavedListing
        {
            Id = Guid.NewGuid(),
            StudentId = userId,
            ApartmentId = apartmentId,
            CreatedAt = DateTime.UtcNow,
        });
        await db.SaveChangesAsync(ct);
        return Ok(new { saved = true });
    }
}
