using System.Security.Claims;
using Dorm.Application.DTOs.Auth;
using Dorm.Application.Services.Auth;
using Dorm.Domain.Enums;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Identity;
using Dorm.Domain.Entities;
using Microsoft.AspNetCore.Mvc;

namespace Dorm.API.Areas.Identity.Controllers;

[Area("Identity")]
public class AccountController(
    UserManager<User> userManager,
    IAuthService authService) : Controller
{
    [HttpGet]
    public IActionResult Login(string? returnUrl = null)
    {
        if (User.Identity?.IsAuthenticated == true)
            return RedirectToDashboard();
        ViewData["Title"] = "Login";
        ViewData["ReturnUrl"] = returnUrl;
        return View();
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Login(string email, string password, string? returnUrl = null)
    {
        ViewData["Title"] = "Login";
        ViewData["ReturnUrl"] = returnUrl;

        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
        {
            ViewData["Error"] = "Please fill in all fields.";
            ViewData["Email"] = email;
            return View();
        }

        var user = await userManager.FindByEmailAsync(email.Trim().ToLowerInvariant());
        if (user is null || !await userManager.CheckPasswordAsync(user, password))
        {
            ViewData["Error"] = "Invalid email or password.";
            ViewData["Email"] = email;
            return View();
        }

        if (user.IsBanned)
        {
            ViewData["Error"] = "This account has been suspended.";
            ViewData["Email"] = email;
            return View();
        }

        await SignInCookieAsync(user);

        if (!string.IsNullOrEmpty(returnUrl) && Url.IsLocalUrl(returnUrl))
            return Redirect(returnUrl);

        return RedirectToDashboard(user.Role);
    }

    [HttpGet]
    public IActionResult Register()
    {
        if (User.Identity?.IsAuthenticated == true)
            return RedirectToDashboard();
        ViewData["Title"] = "Register";
        return View();
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Register(
        string fullName, string email, string password, string? phoneNumber,
        UserRole role, Gender gender, University? university)
    {
        ViewData["Title"] = "Register";

        if (string.IsNullOrWhiteSpace(fullName) || string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
        {
            ViewData["Error"] = "Please fill in all required fields.";
            return View();
        }

        try
        {
            var req = new RegisterRequest(
                fullName.Trim(), email.Trim(), password,
                role, gender, phoneNumber?.Trim() ?? "", university);
            await authService.RegisterAsync(req, HttpContext.RequestAborted);

            var user = await userManager.FindByEmailAsync(email.Trim().ToLowerInvariant());
            if (user is not null)
                await SignInCookieAsync(user);

            return RedirectToDashboard(role);
        }
        catch (FluentValidation.ValidationException vex)
        {
            ViewData["Error"] = string.Join(" ", vex.Errors.Select(e => e.ErrorMessage));
            return View();
        }
        catch (Application.Common.Exceptions.ConflictException)
        {
            ViewData["Error"] = "An account with this email already exists.";
            return View();
        }
        catch (Application.Common.Exceptions.ForbiddenException)
        {
            ViewData["Error"] = "Admin accounts cannot be created via this page.";
            return View();
        }
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Logout()
    {
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        return RedirectToAction("Login");
    }

    [HttpGet]
    public IActionResult ForgotPassword()
    {
        ViewData["Title"] = "Forgot Password";
        return View();
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> ForgotPasswordPost(string email)
    {
        ViewData["Title"] = "Forgot Password";
        if (!string.IsNullOrWhiteSpace(email))
            await authService.ForgotPasswordAsync(new ForgotPasswordRequest(email.Trim()), HttpContext.RequestAborted);
        ViewData["Success"] = "If an account with that email exists, a reset link has been sent.";
        return View("ForgotPassword");
    }

    [HttpGet]
    public async Task<IActionResult> VerifyEmail(string? token)
    {
        ViewData["Title"] = "Verify Email";

        if (string.IsNullOrWhiteSpace(token))
        {
            ViewData["Error"] = "Missing verification token.";
            return View();
        }

        try
        {
            await authService.VerifyEmailAsync(token, HttpContext.RequestAborted);
            ViewData["Success"] = "Email verified successfully!";
        }
        catch
        {
            ViewData["Error"] = "Verification failed. The link may have expired.";
        }

        return View();
    }

    private async Task SignInCookieAsync(User user)
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

        var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
        var principal = new ClaimsPrincipal(identity);

        await HttpContext.SignInAsync(
            CookieAuthenticationDefaults.AuthenticationScheme,
            principal,
            new AuthenticationProperties { IsPersistent = true });
    }

    private IActionResult RedirectToDashboard(UserRole? role = null)
    {
        var r = role ?? Enum.Parse<UserRole>(User.FindFirstValue(ClaimTypes.Role) ?? "Student");
        return r switch
        {
            UserRole.Admin => Redirect("/Admin"),
            UserRole.Student => Redirect("/"),
            _ => Redirect("/Dashboard"),
        };
    }
}
