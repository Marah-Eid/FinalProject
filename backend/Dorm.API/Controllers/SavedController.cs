using Dorm.Application.Abstractions;
using Dorm.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Dorm.API.Controllers;

[Authorize(Policy = AuthPolicies.Student)]
public class SavedController(IAppDbContext db, ICurrentUser currentUser) : Controller
{
    public async Task<IActionResult> Index(CancellationToken ct)
    {
        ViewData["Title"] = "Saved Apartments";
        var userId = currentUser.UserId!.Value;
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
        ViewBag.SavedItems = items;
        return View();
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Remove(Guid apartmentId, CancellationToken ct)
    {
        var userId = currentUser.UserId!.Value;
        var existing = await db.SavedListings
            .FirstOrDefaultAsync(s => s.StudentId == userId && s.ApartmentId == apartmentId, ct);
        if (existing != null)
        {
            db.SavedListings.Remove(existing);
            await db.SaveChangesAsync(ct);
        }
        return RedirectToAction("Index");
    }
}
