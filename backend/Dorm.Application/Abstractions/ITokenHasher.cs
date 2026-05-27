namespace Dorm.Application.Abstractions;

public interface ITokenHasher
{
    /// <summary>Cryptographically random URL-safe token to email to the user.</summary>
    string GenerateToken();
    /// <summary>SHA-256(rawToken) — the form we store in the DB so a leak doesn't expose the live token.</summary>
    string Hash(string rawToken);
}
