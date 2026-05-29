using Microsoft.AspNetCore.Mvc;

namespace Dorm.API.Controllers.Mvc;

public class SavedController : Controller
{
    public IActionResult Index()
    {
        ViewData["Title"] = "Saved Apartments";
        return View();
    }
}
