using Microsoft.AspNetCore.Mvc;

namespace Dorm.API.Controllers.Mvc;

public class ApartmentController : Controller
{
    public IActionResult Detail(Guid id)
    {
        ViewData["Title"] = "Apartment";
        ViewData["ApartmentId"] = id;
        return View();
    }
}
