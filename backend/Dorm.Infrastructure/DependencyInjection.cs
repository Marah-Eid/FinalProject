using System.Text;
using Dorm.Application.Abstractions;
using Dorm.Application.Options;
using Dorm.Infrastructure.Email;
using Dorm.Infrastructure.Identity;
using Dorm.Infrastructure.Payments;
using Dorm.Infrastructure.Persistence;
using Dorm.Infrastructure.Storage;
// IAppDbContext lives in Dorm.Application.Abstractions; using its short form here.
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Dorm.Infrastructure;

/// <summary>
/// Wires up everything the API needs from Infrastructure — DbContext, identity,
/// email, file storage. Called from Program.cs as <c>AddDormInfrastructure</c>.
/// </summary>
public static class DependencyInjection
{
    public static IServiceCollection AddDormInfrastructure(this IServiceCollection services, IConfiguration config)
    {
        // Options ────────────────────────────────────────────────────────────
        services.Configure<JwtOptions>(config.GetSection(JwtOptions.SectionName));
        services.Configure<AppOptions>(config.GetSection(AppOptions.SectionName));
        services.Configure<StorageOptions>(config.GetSection(StorageOptions.SectionName));

        // JWT secret has to be at least 32 UTF-8 bytes for HS256. Fail fast.
        var secret = config.GetSection(JwtOptions.SectionName)["Secret"];
        if (string.IsNullOrWhiteSpace(secret) || Encoding.UTF8.GetByteCount(secret) < 32)
        {
            throw new InvalidOperationException(
                "Jwt:Secret must be set and at least 32 UTF-8 bytes long for HS256 signing.");
        }

        // EF Core / Postgres ─────────────────────────────────────────────────
        var connectionString = config.GetConnectionString("Default")
            ?? throw new InvalidOperationException("ConnectionStrings:Default is not configured.");

        services.AddDbContext<AppDbContext>(o => o.UseSqlServer(connectionString, sql =>
        {
            sql.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName);
        }));
        // Expose the same scoped context behind the Application-layer abstraction.
        services.AddScoped<IAppDbContext>(sp => sp.GetRequiredService<AppDbContext>());

        // Identity services ──────────────────────────────────────────────────
        services.AddSingleton<IPasswordHasher, BCryptPasswordHasher>();
        services.AddSingleton<ITokenHasher, TokenHasher>();
        services.AddSingleton<IJwtTokenService, JwtTokenService>();
        services.AddSingleton<IUniversityEmailDetector, UniversityEmailDetector>();

        // Email (dev) ────────────────────────────────────────────────────────
        services.AddSingleton<IEmailService, DevEmailService>();

        // File storage (local during dev — swap impl later for cloud) ────────
        services.AddSingleton<IFileStorage, LocalFileStorage>();

        // Payments (mock during dev — swap for CliQ later) ───────────────────
        services.AddScoped<IPaymentService, MockPaymentService>();

        return services;
    }
}
