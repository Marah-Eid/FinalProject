using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Dorm.Application.Abstractions;
using Dorm.Application.Options;
using Dorm.Domain.Entities;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace Dorm.Infrastructure.Identity;

/// <summary>
/// HS256 JWT issuer. The Secret must be at least 32 UTF-8 bytes to satisfy
/// HMAC-SHA256's key-length requirement — enforced in DependencyInjection at startup.
/// </summary>
public sealed class JwtTokenService(IOptions<JwtOptions> options) : IJwtTokenService
{
    private readonly JwtOptions _opts = options.Value;

    public AccessTokenIssue IssueAccessToken(User user)
    {
        var now = DateTime.UtcNow;
        var expires = now.AddMinutes(_opts.AccessTokenMinutes);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Role, user.Role.ToString()),
            new("gender", user.Gender.ToString()),
        };

        if (user.IsUniversityVerified)
            claims.Add(new Claim("uni_verified", "true"));

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_opts.Secret));
        var signing = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _opts.Issuer,
            audience: _opts.Audience,
            claims: claims,
            notBefore: now,
            expires: expires,
            signingCredentials: signing);

        return new AccessTokenIssue(new JwtSecurityTokenHandler().WriteToken(token), expires);
    }
}
