using System.Security.Cryptography;
using System.Text;
using Dorm.Application.Abstractions;

namespace Dorm.Infrastructure.Identity;

/// <summary>
/// Generates 256-bit random tokens and SHA-256 hashes them for at-rest storage.
/// Used for refresh tokens, email verification tokens, password reset tokens, and
/// university verification tokens.
/// </summary>
public sealed class TokenHasher : ITokenHasher
{
    public string GenerateToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(32);
        return Convert.ToHexStringLower(bytes);
    }

    public string Hash(string rawToken)
    {
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(rawToken));
        return Convert.ToHexStringLower(hash);
    }
}
