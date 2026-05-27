using FluentValidation;
using Microsoft.AspNetCore.Mvc.Filters;

namespace Dorm.API.Filters;

/// <summary>
/// Action filter that auto-validates request bodies via FluentValidation.
/// For every non-null action argument, it resolves <c>IValidator&lt;T&gt;</c> from DI
/// and (if registered) runs validation. Failures throw <c>ValidationException</c>,
/// which the global middleware turns into a 400 response.
///
/// Registered globally via <c>AddControllers(o =&gt; o.Filters.Add&lt;ValidationFilter&gt;())</c>.
/// </summary>
public sealed class ValidationFilter(IServiceProvider services) : IAsyncActionFilter
{
    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        foreach (var (_, arg) in context.ActionArguments)
        {
            if (arg is null) continue;

            var validatorType = typeof(IValidator<>).MakeGenericType(arg.GetType());
            if (services.GetService(validatorType) is not IValidator validator) continue;

            var validationContext = new ValidationContext<object>(arg);
            var result = await validator.ValidateAsync(validationContext, context.HttpContext.RequestAborted);
            if (!result.IsValid)
                throw new ValidationException(result.Errors);
        }

        await next();
    }
}
