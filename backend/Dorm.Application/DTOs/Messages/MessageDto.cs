namespace Dorm.Application.DTOs.Messages;

public sealed record MessageDto(
    Guid Id,
    Guid ConversationId,
    Guid SenderId,
    string Content,
    bool IsRead,
    DateTime SentAt);

public sealed record SendMessageRequest(string Content);
