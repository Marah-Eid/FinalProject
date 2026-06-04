using Dorm.Application.Abstractions;
using Dorm.Application.DTOs.Testimonials;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Dorm.API.Controllers;

public class HomeController(IAppDbContext db) : Controller
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
        return View();
    }
}
