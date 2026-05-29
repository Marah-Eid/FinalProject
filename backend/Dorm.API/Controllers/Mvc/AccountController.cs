using Microsoft.AspNetCore.Mvc;

namespace Dorm.API.Controllers.Mvc;

public class AccountController : Controller
{
    public IActionResult Login()
    {
        ViewData["Title"] = "Login";
        return View();
    }

    public IActionResult Register()
    {
        ViewData["Title"] = "Register";
        return View();
    }

    public IActionResult ForgotPassword()
    {
        ViewData["Title"] = "Forgot Password";
        return View();
    }

    public IActionResult VerifyEmail(string token)
    {
        ViewData["Title"] = "Verify Email";
        ViewData["Token"] = token;
        return View();
    }
}
