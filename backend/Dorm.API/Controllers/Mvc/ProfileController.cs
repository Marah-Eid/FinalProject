using Microsoft.AspNetCore.Mvc;

namespace Dorm.API.Controllers.Mvc;

public class ProfileController : Controller
{
    public IActionResult Index() => View();
}
