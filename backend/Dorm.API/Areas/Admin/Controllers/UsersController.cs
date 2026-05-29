using Microsoft.AspNetCore.Mvc;

namespace Dorm.API.Areas.Admin.Controllers;

[Area("Admin")]
public class UsersController : Controller
{
    public IActionResult Index()
    {
        ViewData["Title"] = "Manage Users";
        return View();
    }
}
