using Microsoft.AspNetCore.Mvc;

namespace Dorm.API.Controllers.Mvc;

public class BrowseController : Controller
{
    public IActionResult Index()
    {
        ViewData["Title"] = "Browse";
        return View();
    }
}
