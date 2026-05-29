using Dorm.Application.Abstractions;
using Dorm.Application.Common.Exceptions;
using Dorm.Application.DTOs.Quiz;
using Dorm.Application.Services.Quiz;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Dorm.API.Controllers.Api;

[ApiController]
[Route("api/quiz")]
public sealed class QuizController(IQuizService quiz, ICurrentUser currentUser) : ControllerBase
{
    /// <summary>The 8 lifestyle questions and their allowed answer values.</summary>
    [HttpGet("questions")]
    [AllowAnonymous]
    public ActionResult<QuizQuestionsDto> GetQuestions() => Ok(quiz.GetQuestions());

    /// <summary>Save (or overwrite) the current student's quiz answers.</summary>
    [HttpPost("answers")]
    [Authorize(Policy = AuthPolicies.Student)]
    public async Task<IActionResult> SaveAnswers(
        [FromBody] SaveQuizAnswersRequest req,
        CancellationToken ct)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedException();
        await quiz.SaveAnswersAsync(userId, req, ct);
        return NoContent();
    }

    /// <summary>Read back the current student's quiz answers + completion flag.</summary>
    [HttpGet("my-answers")]
    [Authorize(Policy = AuthPolicies.Student)]
    public async Task<ActionResult<QuizMyAnswersDto>> GetMyAnswers(CancellationToken ct)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedException();
        return Ok(await quiz.GetMyAnswersAsync(userId, ct));
    }
}
