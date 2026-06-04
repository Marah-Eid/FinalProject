using Microsoft.AspNetCore.Mvc;

namespace Dorm.API.Controllers;

public class ContactController : Controller
{
    public IActionResult Index() => View();
}
