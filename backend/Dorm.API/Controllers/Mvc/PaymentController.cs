using Microsoft.AspNetCore.Mvc;

namespace Dorm.API.Controllers.Mvc;

public class PaymentController : Controller
{
    public IActionResult Index()
    {
        ViewData["Title"] = "Payments";
        return View();
    }

    public IActionResult Success(string? session_id)
    {
        ViewData["Title"] = "Payment Successful";
        ViewData["SessionId"] = session_id;
        return View();
    }
}
