using Dorm.Domain.Enums;
using Microsoft.AspNetCore.Identity;

namespace Dorm.Domain.Entities;

public class User : IdentityUser<Guid>
{
    public required string FullName { get; set; }
    public UserRole Role { get; set; }
    public Gender Gender { get; set; }
    public bool IsEmailVerified { get; set; }
    public bool IsUniversityVerified { get; set; }
    public string? ProfilePhotoUrl { get; set; }
    public University? University { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsBanned { get; set; }

    // Tokens — stored hashed (SHA-256) so a DB leak doesn't expose them.
    public string? EmailVerificationTokenHash { get; set; }
    public DateTime? EmailVerificationTokenExpiresAt { get; set; }

    public string? PasswordResetTokenHash { get; set; }
    public DateTime? PasswordResetTokenExpiresAt { get; set; }

    public string? PendingUniversityEmail { get; set; }
    public string? UniversityVerificationTokenHash { get; set; }
    public DateTime? UniversityVerificationTokenExpiresAt { get; set; }

    // Navigation
    public StudentProfile? StudentProfile { get; set; }
    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
}
