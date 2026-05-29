using Microsoft.AspNetCore.Mvc;

namespace Dorm.API.Controllers.Mvc;

public class AboutController : Controller
{
    public IActionResult Index() => View();
}
