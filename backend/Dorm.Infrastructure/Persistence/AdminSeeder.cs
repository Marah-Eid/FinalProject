using Dorm.Application.Abstractions;
using Dorm.Domain.Entities;
using Dorm.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Dorm.Infrastructure.Persistence;

/// <summary>
/// Ensures a single Admin user exists on startup. Per the brief's seed-data
/// spec — admin@dorm.jo / Admin123! — fully verified out of the box.
/// </summary>
public static class AdminSeeder
{
    private const string AdminEmail = "admin@dorm.jo";
    private const string AdminPassword = "Admin123!";

    public static async Task EnsureAdminAsync(IServiceProvider services, CancellationToken ct = default)
    {
        var logger = services.GetRequiredService<ILoggerFactory>().CreateLogger(nameof(AdminSeeder));
        var db = services.GetRequiredService<AppDbContext>();
        var hasher = services.GetRequiredService<IPasswordHasher>();

        var exists = await db.Users.AsNoTracking().AnyAsync(u => u.Email == AdminEmail, ct);
        if (exists)
        {
            logger.LogDebug("Admin user already present — skipping seed.");
            return;
        }

        var admin = new User
        {
            Id = Guid.NewGuid(),
            FullName = "Dorm Admin",
            Email = AdminEmail,
            PasswordHash = hasher.Hash(AdminPassword),
            PhoneNumber = "+962780000000",
            Role = UserRole.Admin,
            Gender = Gender.Male,
            IsEmailVerified = true,
            IsUniversityVerified = false,
            CreatedAt = DateTime.UtcNow,
        };
        db.Users.Add(admin);
        await db.SaveChangesAsync(ct);

        logger.LogInformation(
            "[SEED] Admin user created: {Email} / {Password} (please rotate the password in production).",
            AdminEmail, AdminPassword);
    }
}
