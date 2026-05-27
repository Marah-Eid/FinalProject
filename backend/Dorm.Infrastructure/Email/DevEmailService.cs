using Dorm.Application.Abstractions;
using Dorm.Application.Options;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Dorm.Infrastructure.Email;

/// <summary>
/// Development email "service" — writes the verification/reset link to the log
/// so you can copy-paste it from the running console. Production should
/// register a real provider (SendGrid, AWS SES, SMTP) against IEmailService.
/// </summary>
public sealed class DevEmailService(IOptions<AppOptions> app, ILogger<DevEmailService> logger) : IEmailService
{
    private readonly string _frontend = app.Value.FrontendBaseUrl.TrimEnd('/');

    public Task SendEmailVerificationAsync(string toEmail, string fullName, string token, CancellationToken ct = default)
    {
        var link = $"{_frontend}/verify-email?token={token}";
        logger.LogInformation(
            "[DEV-EMAIL] Email verification for {FullName} <{Email}> -> {Link}",
            fullName, toEmail, link);
        return Task.CompletedTask;
    }

    public Task SendPasswordResetAsync(string toEmail, string fullName, string token, CancellationToken ct = default)
    {
        var link = $"{_frontend}/reset-password?token={token}";
        logger.LogInformation(
            "[DEV-EMAIL] Password reset for {FullName} <{Email}> -> {Link}",
            fullName, toEmail, link);
        return Task.CompletedTask;
    }

    public Task SendUniversityVerificationAsync(string toEmail, string fullName, string token, CancellationToken ct = default)
    {
        var link = $"{_frontend}/verify-university?token={token}";
        logger.LogInformation(
            "[DEV-EMAIL] University verification for {FullName} <{Email}> -> {Link}",
            fullName, toEmail, link);
        return Task.CompletedTask;
    }

    public Task SendApplicationReceivedAsync(
        string ownerEmail, string ownerName,
        string studentName, string apartmentTitle, int compatibilityScore,
        CancellationToken ct = default)
    {
        logger.LogInformation(
            "[DEV-EMAIL] Application received for {Owner} <{Email}> — {Student} applied to '{Title}' " +
            "with a {Score}% compatibility match. Open the dashboard to review.",
            ownerName, ownerEmail, studentName, apartmentTitle, compatibilityScore);
        return Task.CompletedTask;
    }

    public Task SendApplicationAcceptedAsync(
        string studentEmail, string studentName,
        string apartmentTitle, string ownerPhoneNumber,
        CancellationToken ct = default)
    {
        logger.LogInformation(
            "[DEV-EMAIL] Application ACCEPTED for {Student} <{Email}> — '{Title}'. " +
            "Owner phone: {Phone}. Next step: pay the 15 JOD platform fee.",
            studentName, studentEmail, apartmentTitle, ownerPhoneNumber);
        return Task.CompletedTask;
    }

    public Task SendApplicationRejectedAsync(
        string studentEmail, string studentName,
        string apartmentTitle,
        CancellationToken ct = default)
    {
        logger.LogInformation(
            "[DEV-EMAIL] Application REJECTED for {Student} <{Email}> — '{Title}'. " +
            "Encourage them to keep browsing.",
            studentName, studentEmail, apartmentTitle);
        return Task.CompletedTask;
    }

    public Task SendNewMessageAsync(
        string toEmail, string toName,
        string fromName, string apartmentTitle,
        CancellationToken ct = default)
    {
        logger.LogInformation(
            "[DEV-EMAIL] New message for {Name} <{Email}> from {From} about '{Title}'.",
            toName, toEmail, fromName, apartmentTitle);
        return Task.CompletedTask;
    }
}
