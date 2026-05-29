using Microsoft.AspNetCore.Mvc;

namespace Dorm.API.Controllers.Mvc;

public class AdminPageController : Controller
{
    [Route("Admin")]
    public IActionResult Index()
    {
        ViewData["Title"] = "Admin Panel";
        return View("~/Views/Admin/Index.cshtml");
    }
}
