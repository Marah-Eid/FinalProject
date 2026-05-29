using Microsoft.AspNetCore.Mvc;

namespace Dorm.API.Controllers.Mvc;

public class OwnerAppsController : Controller
{
    public IActionResult Index()
    {
        ViewData["Title"] = "Applications Received";
        return View();
    }
}
