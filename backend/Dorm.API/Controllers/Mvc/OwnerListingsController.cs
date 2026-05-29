using Microsoft.AspNetCore.Mvc;

namespace Dorm.API.Controllers.Mvc;

public class OwnerListingsController : Controller
{
    public IActionResult Index()
    {
        ViewData["Title"] = "My Listings";
        return View();
    }

    public IActionResult New()
    {
        ViewData["Title"] = "New Listing";
        return View();
    }
}
