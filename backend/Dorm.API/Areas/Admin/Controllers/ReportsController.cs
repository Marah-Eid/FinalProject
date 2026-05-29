using Microsoft.AspNetCore.Mvc;

namespace Dorm.API.Areas.Admin.Controllers;

[Area("Admin")]
public class ReportsController : Controller
{
    public IActionResult Index()
    {
        ViewData["Title"] = "Manage Reports";
        return View();
    }
}
