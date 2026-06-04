using Dorm.Application.Abstractions;
using Dorm.Application.DTOs.Quiz;
using Dorm.Application.Services.Quiz;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Dorm.API.Controllers;

[Route("Quiz")]
[Authorize(Policy = AuthPolicies.Student)]
public class QuizPageController(IQuizService quiz, ICurrentUser currentUser) : Controller
{
    [HttpGet("")]
    public async Task<IActionResult> Index(CancellationToken ct)
    {
        ViewData["Title"] = "Quiz";
        var userId = currentUser.UserId!.Value;
        var questions = quiz.GetQuestions();
        var myAnswers = await quiz.GetMyAnswersAsync(userId, ct);
        ViewBag.Questions = questions;
        ViewBag.MyAnswers = myAnswers;
        return View("~/Views/Quiz/Index.cshtml");
    }

    [HttpPost("Save")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Save([FromBody] SaveQuizAnswersRequest req, CancellationToken ct)
    {
        var userId = currentUser.UserId!.Value;
        await quiz.SaveAnswersAsync(userId, req, ct);
        return Json(new { success = true });
    }
}
