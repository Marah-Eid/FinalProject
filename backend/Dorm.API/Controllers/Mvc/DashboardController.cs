using Microsoft.AspNetCore.Mvc;

namespace Dorm.API.Controllers.Mvc;

public class DashboardController : Controller
{
    public IActionResult Index()
    {
        ViewData["Title"] = "Dashboard";
        return View();
    }
}
