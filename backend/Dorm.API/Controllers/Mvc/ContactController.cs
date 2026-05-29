using Microsoft.AspNetCore.Mvc;

namespace Dorm.API.Controllers.Mvc;

public class ContactController : Controller
{
    public IActionResult Index() => View();
}
