using Dorm.Domain.Entities;
using Dorm.Domain.Enums;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Dorm.Infrastructure.Persistence;

public static class AdminSeeder
{
    private const string AdminEmail = "admin@dorm.jo";
    private const string AdminPassword = "Admin123!";

    public static async Task EnsureAdminAsync(IServiceProvider services, CancellationToken ct = default)
    {
        var logger = services.GetRequiredService<ILoggerFactory>().CreateLogger(nameof(AdminSeeder));
        var userManager = services.GetRequiredService<UserManager<User>>();

        var exists = await userManager.FindByEmailAsync(AdminEmail);
        if (exists is not null)
        {
            logger.LogDebug("Admin user already present — skipping seed.");
            return;
        }

        var admin = new User
        {
            Id = Guid.NewGuid(),
            FullName = "Dorm Admin",
            Email = AdminEmail,
            UserName = AdminEmail,
            PhoneNumber = "+962780000000",
            Role = UserRole.Admin,
            Gender = Gender.Male,
            IsEmailVerified = true,
            IsUniversityVerified = false,
            CreatedAt = DateTime.UtcNow,
        };

        var result = await userManager.CreateAsync(admin, AdminPassword);
        if (!result.Succeeded)
        {
            logger.LogError("[SEED] Failed to create admin: {Errors}",
                string.Join(", ", result.Errors.Select(e => e.Description)));
            return;
        }

        logger.LogInformation(
            "[SEED] Admin user created: {Email} / {Password} (please rotate the password in production).",
            AdminEmail, AdminPassword);
    }
}
