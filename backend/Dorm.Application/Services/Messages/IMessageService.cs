using Dorm.Application.DTOs.Messages;

namespace Dorm.Application.Services.Messages;

public interface IMessageService
{
    /// <summary>All conversations the user participates in, newest activity first.</summary>
    Task<IReadOnlyList<ConversationDto>> GetConversationsAsync(Guid userId, CancellationToken ct);

    /// <summary>
    /// Messages in a single conversation. Use <paramref name="before"/> to page backwards
    /// (older messages); UI displays results in chronological order after reversing.
    /// </summary>
    Task<IReadOnlyList<MessageDto>> GetMessagesAsync(
        Guid conversationId, Guid userId, DateTime? before, int take, CancellationToken ct);

    Task<MessageDto> SendMessageAsync(
        Guid conversationId, Guid senderId, SendMessageRequest req, CancellationToken ct);

    /// <summary>Mark every unread message in the conversation NOT sent by the user as read.</summary>
    Task MarkReadAsync(Guid conversationId, Guid userId, CancellationToken ct);
}
