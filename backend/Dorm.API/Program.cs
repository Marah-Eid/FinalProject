using System.Text;
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
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
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

    // ─── CORS ──────────────────────────────────────────────────────────────
    const string CorsPolicy = "DormFrontend";
    var allowedOrigins = builder.Configuration
        .GetSection("Cors:AllowedOrigins")
        .Get<string[]>() ?? new[] { "http://localhost:5173" };

    builder.Services.AddCors(options => options.AddPolicy(CorsPolicy, policy => policy
        .WithOrigins(allowedOrigins)
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials()));

    // ─── Dorm layers ───────────────────────────────────────────────────────
    builder.Services.AddDormApplication();
    builder.Services.AddDormInfrastructure(builder.Configuration);

    // Current-user accessor uses HttpContextAccessor under the hood.
    builder.Services.AddHttpContextAccessor();
    builder.Services.AddScoped<ICurrentUser, CurrentUserService>();

    // ─── Auth (JWT bearer) ─────────────────────────────────────────────────
    var jwtSection = builder.Configuration.GetSection(JwtOptions.SectionName);
    var jwtSecret = jwtSection["Secret"]!;
    var jwtIssuer = jwtSection["Issuer"]!;
    var jwtAudience = jwtSection["Audience"]!;

    builder.Services
        .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = jwtIssuer,
                ValidAudience = jwtAudience,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
                ClockSkew = TimeSpan.FromMinutes(1),
            };
        });

    builder.Services.AddAuthorization(options =>
    {
        options.AddPolicy(AuthPolicies.Student, p => p.RequireRole(nameof(UserRole.Student)));
        options.AddPolicy(AuthPolicies.Owner,   p => p.RequireRole(nameof(UserRole.Owner)));
        options.AddPolicy(AuthPolicies.Admin,   p => p.RequireRole(nameof(UserRole.Admin)));
    });

    // ─── MVC + filters ─────────────────────────────────────────────────────
    builder.Services.AddControllers(o =>
    {
        o.Filters.Add<ValidationFilter>();
    });

    // ─── Swagger ───────────────────────────────────────────────────────────
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(options =>
    {
        options.SwaggerDoc("v1", new OpenApiInfo
        {
            Title = "Dorm API",
            Version = "v1",
            Description = "Dorm — bilingual student housing platform. See docs/BUILD_BRIEF.md for the spec."
        });

        options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
        {
            Name = "Authorization",
            Type = SecuritySchemeType.Http,
            Scheme = "Bearer",
            BearerFormat = "JWT",
            In = ParameterLocation.Header,
            Description = "Paste the JWT access token here (Swagger adds the 'Bearer ' prefix).",
        });

        // Apply the Bearer scheme to every operation via a small filter.
        options.OperationFilter<Dorm.API.Swagger.BearerSecurityOperationFilter>();
    });

    var app = builder.Build();

    // Bootstrap DB on startup: create the target Postgres database if missing,
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

    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "Dorm API v1"));
    }

    app.UseCors(CorsPolicy);

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
