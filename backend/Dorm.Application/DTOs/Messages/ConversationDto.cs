namespace Dorm.Application.DTOs.Messages;

/// <summary>
/// Row in the user's conversations list. "Other" = the participant who isn't the caller.
/// </summary>
public sealed record ConversationDto(
    Guid Id,
    Guid ApartmentId,
    string ApartmentTitle,
    string? ApartmentMainPhotoUrl,
    Guid OtherUserId,
    string OtherUserName,
    string? OtherUserProfilePhotoUrl,
    string? LastMessageContent,
    Guid? LastMessageSenderId,
    DateTime LastMessageAt,
    int UnreadCount);
