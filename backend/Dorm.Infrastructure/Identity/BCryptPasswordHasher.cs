using Dorm.Application.Abstractions;

namespace Dorm.Infrastructure.Identity;

/// <summary>BCrypt hashing with a moderate work factor (12). Safe default for 2026.</summary>
public sealed class BCryptPasswordHasher : IPasswordHasher
{
    private const int WorkFactor = 12;

    public string Hash(string password) => BCrypt.Net.BCrypt.HashPassword(password, WorkFactor);

    public bool Verify(string password, string hash) => BCrypt.Net.BCrypt.Verify(password, hash);
}
