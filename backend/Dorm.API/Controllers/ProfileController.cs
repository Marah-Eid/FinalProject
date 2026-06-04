using System.Security.Claims;
using Dorm.Application.Abstractions;
using Dorm.Application.DTOs.Auth;
using Dorm.Application.Services.Auth;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Dorm.Domain.Entities;
using Microsoft.AspNetCore.Mvc;

namespace Dorm.API.Controllers;

[Authorize]
public class ProfileController(
    IAuthService authService,
    ICurrentUser currentUser,
    UserManager<User> userManager) : Controller
{
    public async Task<IActionResult> Index(CancellationToken ct)
    {
        ViewData["Title"] = "Edit Profile";
        var userId = currentUser.UserId!.Value;
        var user = await authService.GetCurrentUserAsync(userId, ct);
        ViewBag.UserProfile = user;
        return View();
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Update(string? fullName, string? phoneNumber, Domain.Enums.University? university, CancellationToken ct)
    {
        var userId = currentUser.UserId!.Value;
        var req = new UpdateProfileRequest(fullName, phoneNumber, university);
        var updated = await authService.UpdateProfileAsync(userId, req, ct);

        var user = await userManager.FindByIdAsync(userId.ToString());
        if (user is not null)
        {
            var claims = new List<Claim>
            {
                new(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new(ClaimTypes.Email, user.Email!),
                new(ClaimTypes.Role, user.Role.ToString()),
                new("FullName", user.FullName),
                new("gender", user.Gender.ToString()),
            };
            if (user.IsUniversityVerified)
                claims.Add(new Claim("uni_verified", "true"));

            await HttpContext.SignInAsync(
                CookieAuthenticationDefaults.AuthenticationScheme,
                new ClaimsPrincipal(new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme)),
                new AuthenticationProperties { IsPersistent = true });
        }

        TempData["Success"] = "Profile updated.";
        return RedirectToAction("Index");
    }
}
