using Dorm.Domain.Entities;

namespace Dorm.Application.Abstractions;

public sealed record AccessTokenIssue(string Token, DateTime ExpiresAt);

public interface IJwtTokenService
{
    /// <summary>Issues a signed access token (JWT HS256) for the given user.</summary>
    AccessTokenIssue IssueAccessToken(User user);
}
