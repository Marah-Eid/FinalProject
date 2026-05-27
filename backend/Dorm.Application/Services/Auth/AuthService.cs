using AutoMapper;
using Dorm.Application.Abstractions;
using Dorm.Application.Common.Exceptions;
using Dorm.Application.DTOs.Auth;
using Dorm.Application.Options;
using Dorm.Domain.Entities;
using Dorm.Domain.Enums;
using FluentValidation;
using FluentValidation.Results;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Dorm.Application.Services.Auth;

/// <summary>
/// Orchestrates register / login / refresh / verify-email / forgot+reset /
/// verify-university. Holds no state — all state changes go through AppDbContext.
/// </summary>
public sealed class AuthService(
    IAppDbContext db,
    IPasswordHasher passwordHasher,
    ITokenHasher tokenHasher,
    IJwtTokenService jwtService,
    IEmailService emailService,
    IUniversityEmailDetector uniDetector,
    IOptions<JwtOptions> jwtOptions,
    IMapper mapper) : IAuthService
{
    private readonly JwtOptions _jwt = jwtOptions.Value;

    // Token validity windows.
    private static readonly TimeSpan EmailVerificationLifetime = TimeSpan.FromDays(7);
    private static readonly TimeSpan PasswordResetLifetime = TimeSpan.FromHours(1);
    private static readonly TimeSpan UniversityVerificationLifetime = TimeSpan.FromDays(7);

    public async Task<AuthResponse> RegisterAsync(RegisterRequest req, CancellationToken ct)
    {
        if (req.Role == UserRole.Admin)
            throw new ForbiddenException("Admin accounts cannot be created via this endpoint.");

        var email = Normalize(req.Email);
        if (await db.Users.AsNoTracking().AnyAsync(u => u.Email == email, ct))
            throw new ConflictException("An account with this email already exists.");

        var user = new User
        {
            Id = Guid.NewGuid(),
            FullName = req.FullName.Trim(),
            Email = email,
            PasswordHash = passwordHasher.Hash(req.Password),
            PhoneNumber = req.PhoneNumber.Trim(),
            Role = req.Role,
            Gender = req.Gender,
            University = req.University,
            CreatedAt = DateTime.UtcNow,
        };

        // Issue the email-verification token at registration time and email it.
        var rawVerifyToken = tokenHasher.GenerateToken();
        user.EmailVerificationTokenHash = tokenHasher.Hash(rawVerifyToken);
        user.EmailVerificationTokenExpiresAt = DateTime.UtcNow.Add(EmailVerificationLifetime);

        db.Users.Add(user);
        await db.SaveChangesAsync(ct);

        await emailService.SendEmailVerificationAsync(user.Email, user.FullName, rawVerifyToken, ct);

        return await IssueAuthResponseAsync(user, ct);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest req, CancellationToken ct)
    {
        var email = Normalize(req.Email);
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email, ct);

        if (user is null || !passwordHasher.Verify(req.Password, user.PasswordHash))
            throw new UnauthorizedException("Invalid email or password.");

        if (user.IsBanned)
            throw new ForbiddenException("This account has been suspended.");

        return await IssueAuthResponseAsync(user, ct);
    }

    public async Task<AuthResponse> RefreshAsync(RefreshRequest req, CancellationToken ct)
    {
        var hash = tokenHasher.Hash(req.RefreshToken);
        var stored = await db.RefreshTokens
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.TokenHash == hash, ct);

        if (stored is null
            || stored.RevokedAt is not null
            || stored.ExpiresAt <= DateTime.UtcNow)
        {
            throw new UnauthorizedException("Refresh token is invalid or expired.");
        }

        if (stored.User.IsBanned)
            throw new ForbiddenException("This account has been suspended.");

        // Rotate: revoke the old, issue a new one, link them.
        stored.RevokedAt = DateTime.UtcNow;
        var (rawRefresh, hashRefresh, expiresRefresh) = NewRefreshToken();
        var fresh = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = stored.UserId,
            TokenHash = hashRefresh,
            ExpiresAt = expiresRefresh,
        };
        db.RefreshTokens.Add(fresh);
        stored.ReplacedByTokenId = fresh.Id;
        await db.SaveChangesAsync(ct);

        var access = jwtService.IssueAccessToken(stored.User);
        return new AuthResponse(
            access.Token, access.ExpiresAt,
            rawRefresh, expiresRefresh,
            mapper.Map<UserDto>(stored.User));
    }

    public async Task VerifyEmailAsync(string token, CancellationToken ct)
    {
        var hash = tokenHasher.Hash(token);
        var user = await db.Users.FirstOrDefaultAsync(u => u.EmailVerificationTokenHash == hash, ct);

        if (user is null || user.EmailVerificationTokenExpiresAt is null || user.EmailVerificationTokenExpiresAt <= DateTime.UtcNow)
            throw new UnauthorizedException("Verification link is invalid or expired.");

        user.IsEmailVerified = true;
        user.EmailVerificationTokenHash = null;
        user.EmailVerificationTokenExpiresAt = null;

        // If the signup email is itself a university email, the verification
        // also earns the "Verified Student" badge.
        if (uniDetector.IsUniversityEmail(user.Email))
            user.IsUniversityVerified = true;

        await db.SaveChangesAsync(ct);
    }

    public async Task ForgotPasswordAsync(ForgotPasswordRequest req, CancellationToken ct)
    {
        var email = Normalize(req.Email);
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email, ct);

        // We deliberately return a uniform response whether the email exists,
        // to avoid revealing which addresses are registered.
        if (user is null) return;

        var raw = tokenHasher.GenerateToken();
        user.PasswordResetTokenHash = tokenHasher.Hash(raw);
        user.PasswordResetTokenExpiresAt = DateTime.UtcNow.Add(PasswordResetLifetime);
        await db.SaveChangesAsync(ct);

        await emailService.SendPasswordResetAsync(user.Email, user.FullName, raw, ct);
    }

    public async Task ResetPasswordAsync(ResetPasswordRequest req, CancellationToken ct)
    {
        var hash = tokenHasher.Hash(req.Token);
        var user = await db.Users.FirstOrDefaultAsync(u => u.PasswordResetTokenHash == hash, ct);

        if (user is null || user.PasswordResetTokenExpiresAt is null || user.PasswordResetTokenExpiresAt <= DateTime.UtcNow)
            throw new UnauthorizedException("Reset link is invalid or expired.");

        user.PasswordHash = passwordHasher.Hash(req.NewPassword);
        user.PasswordResetTokenHash = null;
        user.PasswordResetTokenExpiresAt = null;

        // Revoke any outstanding refresh tokens for the user so old sessions can't be replayed.
        await db.RefreshTokens
            .Where(r => r.UserId == user.Id && r.RevokedAt == null)
            .ExecuteUpdateAsync(s => s.SetProperty(r => r.RevokedAt, DateTime.UtcNow), ct);

        await db.SaveChangesAsync(ct);
    }

    public async Task RequestUniversityVerificationAsync(Guid userId, VerifyUniversityRequest req, CancellationToken ct)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct)
            ?? throw new NotFoundException("User not found.");

        if (user.Role != UserRole.Student)
            throw new ForbiddenException("Only students can claim the verified-student badge.");

        if (!uniDetector.IsUniversityEmail(req.UniversityEmail))
        {
            throw new ValidationException(new[]
            {
                new ValidationFailure(nameof(req.UniversityEmail),
                    "Provide an email from a recognized Jordanian university domain (.edu.jo).")
            });
        }

        var raw = tokenHasher.GenerateToken();
        user.PendingUniversityEmail = Normalize(req.UniversityEmail);
        user.UniversityVerificationTokenHash = tokenHasher.Hash(raw);
        user.UniversityVerificationTokenExpiresAt = DateTime.UtcNow.Add(UniversityVerificationLifetime);
        await db.SaveChangesAsync(ct);

        await emailService.SendUniversityVerificationAsync(
            user.PendingUniversityEmail!, user.FullName, raw, ct);
    }

    public async Task ConfirmUniversityVerificationAsync(string token, CancellationToken ct)
    {
        var hash = tokenHasher.Hash(token);
        var user = await db.Users.FirstOrDefaultAsync(u => u.UniversityVerificationTokenHash == hash, ct);

        if (user is null || user.UniversityVerificationTokenExpiresAt is null || user.UniversityVerificationTokenExpiresAt <= DateTime.UtcNow)
            throw new UnauthorizedException("Verification link is invalid or expired.");

        user.IsUniversityVerified = true;
        user.UniversityVerificationTokenHash = null;
        user.UniversityVerificationTokenExpiresAt = null;
        user.PendingUniversityEmail = null;
        await db.SaveChangesAsync(ct);
    }

    public async Task<UserDto> GetCurrentUserAsync(Guid userId, CancellationToken ct)
    {
        var user = await db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId, ct)
            ?? throw new NotFoundException("User not found.");
        return mapper.Map<UserDto>(user);
    }

    // ── helpers ─────────────────────────────────────────────────────────────

    private async Task<AuthResponse> IssueAuthResponseAsync(User user, CancellationToken ct)
    {
        var access = jwtService.IssueAccessToken(user);
        var (rawRefresh, hashRefresh, expiresRefresh) = NewRefreshToken();

        db.RefreshTokens.Add(new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = hashRefresh,
            ExpiresAt = expiresRefresh,
        });
        await db.SaveChangesAsync(ct);

        return new AuthResponse(
            access.Token, access.ExpiresAt,
            rawRefresh, expiresRefresh,
            mapper.Map<UserDto>(user));
    }

    private (string Raw, string Hash, DateTime ExpiresAt) NewRefreshToken()
    {
        var raw = tokenHasher.GenerateToken();
        return (raw, tokenHasher.Hash(raw), DateTime.UtcNow.AddDays(_jwt.RefreshTokenDays));
    }

    private static string Normalize(string email) => email.Trim().ToLowerInvariant();
}
