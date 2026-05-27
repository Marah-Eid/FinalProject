using Microsoft.OpenApi;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace Dorm.API.Swagger;

/// <summary>
/// Attaches the "Bearer" security definition to every Swagger operation so the
/// lock icon shows up in the UI. Equivalent to a global AddSecurityRequirement
/// call, but works under Microsoft.OpenApi 2.x where OpenApiReference is gone.
/// </summary>
public sealed class BearerSecurityOperationFilter : IOperationFilter
{
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        operation.Security ??= new List<OpenApiSecurityRequirement>();
        if (operation.Security.Count > 0) return;

        // Reference the registered "Bearer" definition by id.
        var bearerRef = new OpenApiSecuritySchemeReference("Bearer");
        operation.Security.Add(new OpenApiSecurityRequirement { [bearerRef] = new List<string>() });
    }
}
