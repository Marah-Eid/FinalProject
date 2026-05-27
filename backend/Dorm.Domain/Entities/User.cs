using Dorm.Domain.Enums;

namespace Dorm.Domain.Entities;

/// <summary>
/// Account record. Same row regardless of role — Student / Owner / Admin.
/// Role-specific data lives in <see cref="StudentProfile"/> (for students).
/// </summary>
public class User
{
    public Guid Id { get; set; }
    public required string FullName { get; set; }
    public required string Email { get; set; }
    public required string PasswordHash { get; set; }
    public required string PhoneNumber { get; set; }
    public UserRole Role { get; set; }
    public Gender Gender { get; set; }
    public bool IsEmailVerified { get; set; }
    public bool IsUniversityVerified { get; set; }
    public string? ProfilePhotoUrl { get; set; }
    public University? University { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsBanned { get; set; }

    // Tokens — stored hashed (SHA-256) so a DB leak doesn't expose them.
    // Only one outstanding per purpose at a time; subsequent issuance overwrites.
    public string? EmailVerificationTokenHash { get; set; }
    public DateTime? EmailVerificationTokenExpiresAt { get; set; }

    public string? PasswordResetTokenHash { get; set; }
    public DateTime? PasswordResetTokenExpiresAt { get; set; }

    // Optional second email used to claim the "Verified Student" badge when the
    // user did not sign up with a university domain.
    public string? PendingUniversityEmail { get; set; }
    public string? UniversityVerificationTokenHash { get; set; }
    public DateTime? UniversityVerificationTokenExpiresAt { get; set; }

    // Navigation
    public StudentProfile? StudentProfile { get; set; }
    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
}
