using Microsoft.AspNetCore.Mvc;

namespace Dorm.API.Controllers.Mvc;

public class ChatController : Controller
{
    public IActionResult Index()
    {
        ViewData["Title"] = "Messages";
        return View();
    }

    [Route("Chat/{id:int}")]
    public IActionResult Conversation(int id)
    {
        ViewData["Title"] = "Messages";
        ViewData["ConversationId"] = id;
        return View();
    }
}
