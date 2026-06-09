using System.Security.Claims;
using Dorm.Application.Abstractions;
using Dorm.Application.DTOs.Auth;
using Dorm.Application.Services.Auth;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Dorm.Domain.Entities;
using Dorm.Domain.Enums;
using Microsoft.AspNetCore.Mvc;

namespace Dorm.API.Controllers;

[Authorize]
public class ProfileController(
    IAuthService authService,
    ICurrentUser currentUser,
    UserManager<User> userManager,
    IWebHostEnvironment env) : Controller
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

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> UploadId(IFormFile? idDocument, CancellationToken ct)
    {
        var user = await userManager.FindByIdAsync(currentUser.UserId!.Value.ToString());
        if (user is null || user.Role != UserRole.Owner)
            return Forbid();

        if (idDocument is null || idDocument.Length == 0)
        {
            TempData["IdError"] = "Please select a file to upload.";
            return RedirectToAction("Index");
        }

        var allowed = new[] { ".jpg", ".jpeg", ".png", ".pdf" };
        var ext = Path.GetExtension(idDocument.FileName).ToLowerInvariant();
        if (!allowed.Contains(ext))
        {
            TempData["IdError"] = "Only JPG, PNG, or PDF files are accepted.";
            return RedirectToAction("Index");
        }

        if (idDocument.Length > 5 * 1024 * 1024)
        {
            TempData["IdError"] = "File must be under 5 MB.";
            return RedirectToAction("Index");
        }

        var dir = Path.Combine(env.WebRootPath, "uploads", "ids");
        Directory.CreateDirectory(dir);

        // Delete old file if it exists and has a different extension
        if (!string.IsNullOrEmpty(user.IdDocumentUrl))
        {
            var oldPath = Path.Combine(env.WebRootPath, user.IdDocumentUrl.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));
            if (System.IO.File.Exists(oldPath))
                System.IO.File.Delete(oldPath);
        }

        var fileName = $"{user.Id}{ext}";
        var path = Path.Combine(dir, fileName);
        await using var stream = System.IO.File.Create(path);
        await idDocument.CopyToAsync(stream, ct);

        user.IdDocumentUrl = $"/uploads/ids/{fileName}";
        user.IsIdVerified = false;
        var result = await userManager.UpdateAsync(user);
        if (!result.Succeeded)
        {
            System.IO.File.Delete(path);
            TempData["IdError"] = "Failed to save: " + string.Join(", ", result.Errors.Select(e => e.Description));
            return RedirectToAction("Index");
        }

        TempData["Success"] = "ID document uploaded. The admin will review it shortly.";
        return RedirectToAction("Index");
    }
}
