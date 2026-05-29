using Microsoft.AspNetCore.Mvc;

namespace Dorm.API.Areas.Admin.Controllers;

[Area("Admin")]
public class ListingsController : Controller
{
    public IActionResult Index()
    {
        ViewData["Title"] = "Manage Listings";
        return View();
    }
}
