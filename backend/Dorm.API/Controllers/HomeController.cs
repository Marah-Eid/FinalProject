using Dorm.Application.Abstractions;
using Dorm.Application.DTOs.Apartments;
using Dorm.Application.DTOs.Testimonials;
using Dorm.Application.Services.Apartments;
using Dorm.Domain.Enums;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Dorm.API.Controllers;

public class HomeController(
    IAppDbContext db,
    IApartmentService apartments,
    ICurrentUser currentUser) : Controller
{
    public async Task<IActionResult> Index(CancellationToken ct)
    {
        ViewData["Title"] = "Home";
        var testimonials = await db.Testimonials
            .AsNoTracking()
            .Where(t => t.IsApproved)
            .Include(t => t.User)
            .OrderByDescending(t => t.CreatedAt)
            .Take(10)
            .Select(t => new TestimonialDto(
                t.Id, t.User.FullName, t.User.Role.ToString(),
                t.Stars, t.Text, t.IsApproved, t.CreatedAt))
            .ToListAsync(ct);
        ViewBag.Testimonials = testimonials;

        if (currentUser.IsAuthenticated && currentUser.Role == UserRole.Student)
        {
            var user = await db.Users.AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == currentUser.UserId!.Value, ct);
            if (user?.University is { } uni)
            {
                var uniCity = UniversityCity(uni);
                var nearby = await apartments.GetListAsync(new ApartmentListQuery
                {
                    University = uni,
                    City = uniCity,
                    Page = 1,
                    PageSize = 6,
                }, ct);
                ViewBag.NearbyApartments = nearby.Items;
                ViewBag.StudentUniversity = uni;
            }
        }

        return View();
    }

    private static City? UniversityCity(University uni) => uni switch
    {
        University.JU or University.GJU or University.PSUT
            or University.UOP or University.MEU or University.ASU
            or University.WISE or University.PU or University.Isra
            or University.AAU => City.Amman,

        University.YU or University.JUST or University.Jadara
            or University.BAU => City.Irbid,

        University.HU or University.ZU => City.Zarqa,

        University.MU or University.Tafila => City.Karak,

        University.AABU => City.Mafraq,

        _ => null,
    };
}
