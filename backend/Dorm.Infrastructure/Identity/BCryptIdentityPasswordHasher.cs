using Dorm.Domain.Entities;
using Microsoft.AspNetCore.Identity;

namespace Dorm.Infrastructure.Identity;

public sealed class BCryptIdentityPasswordHasher : IPasswordHasher<User>
{
    private const int WorkFactor = 12;

    public string HashPassword(User user, string password) =>
        BCrypt.Net.BCrypt.HashPassword(password, WorkFactor);

    public PasswordVerificationResult VerifyHashedPassword(User user, string hashedPassword, string providedPassword) =>
        BCrypt.Net.BCrypt.Verify(providedPassword, hashedPassword)
            ? PasswordVerificationResult.Success
            : PasswordVerificationResult.Failed;
}
