using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Npgsql;

namespace Dorm.Infrastructure.Persistence;

/// <summary>
/// Helpers run from Program.cs on startup so we don't need an out-of-band
/// "create the database first" step on a fresh machine.
/// </summary>
public static class DatabaseBootstrap
{
    /// <summary>
    /// Connects to the Postgres maintenance database ("postgres") and runs
    /// CREATE DATABASE for the target if it doesn't exist yet.
    /// Idempotent.
    /// </summary>
    public static async Task EnsureDatabaseExistsAsync(string connectionString, ILogger logger, CancellationToken ct = default)
    {
        var builder = new NpgsqlConnectionStringBuilder(connectionString);
        var targetDatabase = builder.Database;
        if (string.IsNullOrWhiteSpace(targetDatabase))
        {
            throw new InvalidOperationException("Connection string is missing the Database segment.");
        }

        builder.Database = "postgres";  // server-level maintenance DB

        await using var conn = new NpgsqlConnection(builder.ConnectionString);
        await conn.OpenAsync(ct);

        await using (var check = conn.CreateCommand())
        {
            check.CommandText = "SELECT 1 FROM pg_database WHERE datname = @name";
            check.Parameters.AddWithValue("name", targetDatabase);
            var exists = await check.ExecuteScalarAsync(ct);
            if (exists is not null)
            {
                logger.LogDebug("Database {Database} already exists.", targetDatabase);
                return;
            }
        }

        logger.LogInformation("Creating database {Database}...", targetDatabase);
        await using var create = conn.CreateCommand();
        // Identifier quoting because the database name might contain characters that need escaping.
        create.CommandText = $"CREATE DATABASE \"{targetDatabase.Replace("\"", "\"\"")}\"";
        await create.ExecuteNonQueryAsync(ct);
    }

    /// <summary>
    /// Convenience: ensure DB exists, then apply pending migrations.
    /// Call once at startup inside a scoped DI scope.
    /// </summary>
    public static async Task EnsureCreatedAndMigratedAsync(
        IServiceProvider services,
        string connectionString,
        CancellationToken ct = default)
    {
        var logger = services.GetRequiredService<ILoggerFactory>().CreateLogger(nameof(DatabaseBootstrap));

        await EnsureDatabaseExistsAsync(connectionString, logger, ct);

        var db = services.GetRequiredService<AppDbContext>();
        var pending = (await db.Database.GetPendingMigrationsAsync(ct)).ToArray();
        if (pending.Length > 0)
        {
            logger.LogInformation("Applying {Count} pending migration(s): {Migrations}",
                pending.Length, string.Join(", ", pending));
            await db.Database.MigrateAsync(ct);
        }

        // Always make sure an Admin account exists. Idempotent; logs once on first run.
        await AdminSeeder.EnsureAdminAsync(services, ct);
    }

    /// <summary>
    /// Run the comprehensive demo-data seed (Phase 12). Triggered from
    /// Program.cs when <c>Dorm:Seed=true</c>. Idempotent — skips when the
    /// marker user is already present.
    /// </summary>
    public static Task SeedDemoDataAsync(IServiceProvider services, CancellationToken ct = default) =>
        DataSeeder.RunAsync(services, ct);
}
