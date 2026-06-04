using Microsoft.AspNetCore.Mvc;

namespace Dorm.API.Controllers;

public class AboutController : Controller
{
    public IActionResult Index() => View();
}
