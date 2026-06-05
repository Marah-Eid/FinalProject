using Dorm.Application.Common.Exceptions;
using FluentValidation;

namespace Dorm.API.Middleware;

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

            if (IsApiRequest(ctx))
            {
                await WriteJsonAsync(ctx, 400, "validation_failed", "Validation failed.", details);
            }
            else
            {
                foreach (var (key, msgs) in details)
                    foreach (var msg in msgs)
                        ctx.Items[$"Error_{key}"] = msg;
                ctx.Response.StatusCode = 400;
            }
        }
        catch (ApiException apiEx)
        {
            if (IsApiRequest(ctx))
            {
                await WriteJsonAsync(ctx, apiEx.StatusCode, apiEx.Code, apiEx.Message);
            }
            else
            {
                if (apiEx.StatusCode == 401 || apiEx.StatusCode == 403)
                    ctx.Response.Redirect("/Identity/Account/Login");
                else if (apiEx.StatusCode == 404)
                    ctx.Response.StatusCode = 404;
                else
                    ctx.Response.StatusCode = apiEx.StatusCode;
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled exception on {Method} {Path}", ctx.Request.Method, ctx.Request.Path);

            if (IsApiRequest(ctx))
                await WriteJsonAsync(ctx, 500, "internal_error", "An unexpected error occurred.");
            else
                ctx.Response.StatusCode = 500;
        }
    }

    private static bool IsApiRequest(HttpContext ctx) =>
        ctx.Request.Path.StartsWithSegments("/api") ||
        ctx.Request.Headers.Accept.Any(a => a != null && a.Contains("application/json"));

    private static Task WriteJsonAsync(
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
