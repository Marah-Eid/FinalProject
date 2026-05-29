using Microsoft.AspNetCore.Mvc;

namespace Dorm.API.Controllers.Mvc;

public class PaymentController : Controller
{
    public IActionResult Index()
    {
        ViewData["Title"] = "Payments";
        return View();
    }
}
