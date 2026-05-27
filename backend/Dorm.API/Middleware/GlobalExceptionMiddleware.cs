using Dorm.Application.Common.Exceptions;
using FluentValidation;

namespace Dorm.API.Middleware;

/// <summary>
/// Translates unhandled exceptions into a consistent JSON error envelope:
///     { "error": { "code": "...", "message": "...", "details": {...}? } }
///
/// Recognised exception types:
///   • FluentValidation.ValidationException → 400, code=validation_failed, details grouped by field
///   • ApiException subclasses (NotFound, Conflict, Unauthorized, Forbidden, BadRequest) → status+code per subclass
///   • Everything else → 500, code=internal_error (and we log the stack trace)
/// </summary>
public sealed class GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext ctx)
    {
        try
        {
            await next(ctx);
        }
        catch (ValidationException fvEx)
        {
            var details = fvEx.Errors
                .GroupBy(e => string.IsNullOrEmpty(e.PropertyName) ? "_" : e.PropertyName)
                .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());
            await WriteAsync(ctx, 400, "validation_failed", "Validation failed.", details);
        }
        catch (ApiException apiEx)
        {
            await WriteAsync(ctx, apiEx.StatusCode, apiEx.Code, apiEx.Message);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled exception on {Method} {Path}", ctx.Request.Method, ctx.Request.Path);
            await WriteAsync(ctx, 500, "internal_error", "An unexpected error occurred.");
        }
    }

    private static Task WriteAsync(
        HttpContext ctx, int status, string code, string message,
        IDictionary<string, string[]>? details = null)
    {
        if (ctx.Response.HasStarted) return Task.CompletedTask;
        ctx.Response.Clear();
        ctx.Response.StatusCode = status;
        ctx.Response.ContentType = "application/json; charset=utf-8";

        var payload = details is null
            ? (object)new { error = new { code, message } }
            : new { error = new { code, message, details } };

        return ctx.Response.WriteAsJsonAsync(payload);
    }
}
