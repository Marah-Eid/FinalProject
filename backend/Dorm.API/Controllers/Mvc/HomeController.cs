using Microsoft.AspNetCore.Mvc;

namespace Dorm.API.Controllers.Mvc;

public class HomeController : Controller
{
    public IActionResult Index()
    {
        ViewData["Title"] = "Home";
        return View();
    }
}
