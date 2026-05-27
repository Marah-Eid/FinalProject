using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Dorm.Infrastructure.Persistence;

public static class DatabaseBootstrap
{
    public static async Task EnsureDatabaseExistsAsync(string connectionString, ILogger logger, CancellationToken ct = default)
    {
        var builder = new SqlConnectionStringBuilder(connectionString);
        var targetDatabase = builder.InitialCatalog;
        if (string.IsNullOrWhiteSpace(targetDatabase))
        {
            throw new InvalidOperationException("Connection string is missing the Database (Initial Catalog) segment.");
        }

        builder.InitialCatalog = "master";

        await using var conn = new SqlConnection(builder.ConnectionString);
        await conn.OpenAsync(ct);

        await using (var check = conn.CreateCommand())
        {
            check.CommandText = "SELECT 1 FROM sys.databases WHERE name = @name";
            check.Parameters.AddWithValue("@name", targetDatabase);
            var exists = await check.ExecuteScalarAsync(ct);
            if (exists is not null)
            {
                logger.LogDebug("Database {Database} already exists.", targetDatabase);
                return;
            }
        }

        logger.LogInformation("Creating database {Database}...", targetDatabase);
        await using var create = conn.CreateCommand();
        create.CommandText = $"CREATE DATABASE [{targetDatabase.Replace("]", "]]")}]";
        await create.ExecuteNonQueryAsync(ct);
    }

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

        await AdminSeeder.EnsureAdminAsync(services, ct);
    }

    public static Task SeedDemoDataAsync(IServiceProvider services, CancellationToken ct = default) =>
        DataSeeder.RunAsync(services, ct);
}
