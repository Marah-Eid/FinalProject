namespace Dorm.Application.Abstractions;

/// <summary>
/// Outbound transactional emails. The dev implementation just logs the link
/// to the console; swap in a real provider later by registering a different
/// implementation.
/// </summary>
public interface IEmailService
{
    Task SendEmailVerificationAsync(string toEmail, string fullName, string token, CancellationToken ct = default);
    Task SendPasswordResetAsync(string toEmail, string fullName, string token, CancellationToken ct = default);
    Task SendUniversityVerificationAsync(string toEmail, string fullName, string token, CancellationToken ct = default);

    // ── Phase 7: application + messaging notifications ─────────────────────
    Task SendApplicationReceivedAsync(
        string ownerEmail, string ownerName,
        string studentName, string apartmentTitle, int compatibilityScore,
        CancellationToken ct = default);

    Task SendApplicationAcceptedAsync(
        string studentEmail, string studentName,
        string apartmentTitle, string ownerPhoneNumber,
        CancellationToken ct = default);

    Task SendApplicationRejectedAsync(
        string studentEmail, string studentName,
        string apartmentTitle,
        CancellationToken ct = default);

    /// <summary>Optional new-message email — the brief asks for it when the recipient has been offline > 1h.</summary>
    Task SendNewMessageAsync(
        string toEmail, string toName,
        string fromName, string apartmentTitle,
        CancellationToken ct = default);
}
