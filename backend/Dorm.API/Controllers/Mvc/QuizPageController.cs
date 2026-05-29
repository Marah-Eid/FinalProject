using Microsoft.AspNetCore.Mvc;

namespace Dorm.API.Controllers.Mvc;

[Route("Quiz")]
public class QuizPageController : Controller
{
    [HttpGet("")]
    public IActionResult Index()
    {
        ViewData["Title"] = "Quiz";
        return View("~/Views/Quiz/Index.cshtml");
    }
}
