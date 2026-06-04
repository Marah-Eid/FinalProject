using Dorm.Application.Abstractions;
using Dorm.Application.DTOs.Apartments;
using Dorm.Application.Services.Apartments;
using Dorm.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Dorm.API.Controllers;

public class BrowseController(IApartmentService apartments, ICurrentUser currentUser, IAppDbContext db) : Controller
{
    [AllowAnonymous]
    public async Task<IActionResult> Index(
        City? city, string? neighborhood, University? university,
        decimal? minPrice, decimal? maxPrice, int? spotsAvailable,
        bool? furnished, [FromQuery(Name = "amenities")] AmenityType[]? amenities,
        int? maxDistance, string? sort, int page = 1,
        CancellationToken ct = default)
    {
        ViewData["Title"] = "Browse";
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
            PageSize = 20,
        };
        var result = await apartments.GetListAsync(query, ct);
        ViewBag.Apartments = result;
        ViewBag.Query = query;

        if (currentUser.IsAuthenticated && currentUser.Role == UserRole.Student)
        {
            var savedIds = await db.SavedListings
                .Where(s => s.StudentId == currentUser.UserId!.Value)
                .Select(s => s.ApartmentId)
                .ToListAsync(ct);
            ViewBag.SavedIds = savedIds;
        }

        return View();
    }

    [AllowAnonymous]
    [HttpGet("Browse/Api/List")]
    public async Task<IActionResult> ApiList(
        City? city, string? neighborhood, University? university,
        decimal? minPrice, decimal? maxPrice, int? spotsAvailable,
        bool? furnished, [FromQuery(Name = "amenities")] AmenityType[]? amenities,
        int? maxDistance, string? sort, int page = 1,
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
            PageSize = 20,
        };
        return Json(await apartments.GetListAsync(query, ct));
    }
}
