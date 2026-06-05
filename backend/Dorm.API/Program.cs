using Dorm.API;
using Dorm.API.Filters;
using Dorm.API.Identity;
using Dorm.API.Middleware;
using Dorm.Application;
using Dorm.Application.Abstractions;
using Dorm.Application.Options;
using Dorm.Domain.Enums;
using Dorm.Infrastructure;
using Dorm.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Options;
using Serilog;

// Bootstrap logger so we capture startup failures before the full config is read.
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    Log.Information("Starting Dorm.API");

    var builder = WebApplication.CreateBuilder(args);

    // Replace default logging with Serilog, configured from appsettings.json.
    builder.Host.UseSerilog((context, services, configuration) => configuration
        .ReadFrom.Configuration(context.Configuration)
        .ReadFrom.Services(services)
        .Enrich.FromLogContext());

    // ─── Dorm layers ───────────────────────────────────────────────────────
    builder.Services.AddDormApplication();
    builder.Services.AddDormInfrastructure(builder.Configuration);

    // Current-user accessor uses HttpContextAccessor under the hood.
    builder.Services.AddHttpContextAccessor();
    builder.Services.AddScoped<ICurrentUser, CurrentUserService>();

    // ─── Auth (cookie) ───────────────────────────────────────────────────
    builder.Services
        .AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
        .AddCookie(options =>
        {
            options.LoginPath = "/Identity/Account/Login";
            options.LogoutPath = "/Identity/Account/Logout";
            options.AccessDeniedPath = "/Identity/Account/Login";
            options.Cookie.Name = "Dorm.Auth";
            options.Cookie.HttpOnly = true;
            options.Cookie.SameSite = SameSiteMode.Lax;
            options.ExpireTimeSpan = TimeSpan.FromDays(14);
            options.SlidingExpiration = true;
        });

    builder.Services.AddAuthorization(options =>
    {
        options.AddPolicy(AuthPolicies.Student, p => p.RequireRole(nameof(UserRole.Student)));
        options.AddPolicy(AuthPolicies.Owner,   p => p.RequireRole(nameof(UserRole.Owner)));
        options.AddPolicy(AuthPolicies.Admin,   p => p.RequireRole(nameof(UserRole.Admin)));
    });

    // ─── MVC + filters ─────────────────────────────────────────────────────
    builder.Services.AddControllersWithViews(o =>
    {
        o.Filters.Add<ValidationFilter>();
    });

    var app = builder.Build();

    // Bootstrap DB on startup: create the database if missing,
    // then apply any pending EF migrations. Idempotent.
    using (var scope = app.Services.CreateScope())
    {
        var connectionString = builder.Configuration.GetConnectionString("Default")!;
        await DatabaseBootstrap.EnsureCreatedAndMigratedAsync(scope.ServiceProvider, connectionString);

        // Optional demo-data seed — enable with `Dorm__Seed=true` env var
        // (or "Dorm": { "Seed": true } in appsettings).
        var seedEnabled = builder.Configuration.GetValue<bool>("Dorm:Seed");
        if (seedEnabled)
            await DatabaseBootstrap.SeedDemoDataAsync(scope.ServiceProvider);
    }

    // ─── Middleware pipeline ───────────────────────────────────────────────
    // Global exception middleware first so it catches everything below.
    app.UseMiddleware<GlobalExceptionMiddleware>();

    app.UseSerilogRequestLogging();

    // Serve static files from wwwroot (templates, JS, CSS, images).
    app.UseStaticFiles();

    // Serve uploaded files. We point /uploads at the storage root configured in
    // appsettings so this works in dev (wwwroot/uploads) and we can swap to a
    // different root later (or replace LocalFileStorage with a cloud blob impl).
    {
        var storage = app.Services.GetRequiredService<IOptions<StorageOptions>>().Value;
        var uploadsAbs = Path.Combine(app.Environment.ContentRootPath, storage.LocalRoot);
        Directory.CreateDirectory(uploadsAbs);
        app.UseStaticFiles(new StaticFileOptions
        {
            FileProvider = new PhysicalFileProvider(uploadsAbs),
            RequestPath = storage.PublicBaseUrl.TrimEnd('/'),
        });
    }

    app.UseAuthentication();
    app.UseAuthorization();

    app.MapControllerRoute(
        name: "areas",
        pattern: "{area:exists}/{controller=Dashboard}/{action=Index}/{id?}");

    app.MapControllerRoute(
        name: "default",
        pattern: "{controller=Home}/{action=Index}/{id?}");

    app.MapControllers();

    app.Run();
}
catch (Exception ex) when (ex is not HostAbortedException)
{
    Log.Fatal(ex, "Dorm.API terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
