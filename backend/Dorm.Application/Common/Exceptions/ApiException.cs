namespace Dorm.Application.Common.Exceptions;

/// <summary>
/// Base for exceptions the global middleware translates into a structured
/// HTTP response. Each subclass carries its own status + machine code.
///
/// Input-DTO validation uses FluentValidation.ValidationException directly —
/// the middleware understands both.
/// </summary>
public abstract class ApiException(string message) : Exception(message)
{
    public abstract int StatusCode { get; }
    public abstract string Code { get; }
}

public sealed class NotFoundException(string message) : ApiException(message)
{
    public override int StatusCode => StatusCodes.NotFound;
    public override string Code => "not_found";
}

public sealed class ConflictException(string message) : ApiException(message)
{
    public override int StatusCode => StatusCodes.Conflict;
    public override string Code => "conflict";
}

public sealed class UnauthorizedException(string message = "Authentication required") : ApiException(message)
{
    public override int StatusCode => StatusCodes.Unauthorized;
    public override string Code => "unauthorized";
}

public sealed class ForbiddenException(string message = "Forbidden") : ApiException(message)
{
    public override int StatusCode => StatusCodes.Forbidden;
    public override string Code => "forbidden";
}

public sealed class BadRequestException(string message) : ApiException(message)
{
    public override int StatusCode => StatusCodes.BadRequest;
    public override string Code => "bad_request";
}

internal static class StatusCodes
{
    public const int BadRequest = 400;
    public const int Unauthorized = 401;
    public const int Forbidden = 403;
    public const int NotFound = 404;
    public const int Conflict = 409;
}
