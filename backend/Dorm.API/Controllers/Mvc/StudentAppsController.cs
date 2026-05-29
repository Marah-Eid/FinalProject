using Microsoft.AspNetCore.Mvc;

namespace Dorm.API.Controllers.Mvc;

public class StudentAppsController : Controller
{
    public IActionResult Index()
    {
        ViewData["Title"] = "My Applications";
        return View();
    }
}
