namespace Dorm.Domain.Entities;

/// <summary>
/// Rotating refresh token. We store the SHA-256 hash of the token, not the token itself.
/// On refresh: validate the presented token's hash matches a row whose
/// RevokedAt is null and ExpiresAt is in the future; revoke it, issue a new one,
/// and set ReplacedByTokenId so the chain is auditable.
/// </summary>
public class RefreshToken
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public required string TokenHash { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime ExpiresAt { get; set; }
    public DateTime? RevokedAt { get; set; }
    public Guid? ReplacedByTokenId { get; set; }
    public RefreshToken? ReplacedByToken { get; set; }
}
