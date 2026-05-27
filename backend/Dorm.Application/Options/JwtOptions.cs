namespace Dorm.Application.Options;

public sealed class JwtOptions
{
    public const string SectionName = "Jwt";

    public required string Secret { get; set; }
    public required string Issuer { get; set; }
    public required string Audience { get; set; }
    public int AccessTokenMinutes { get; set; } = 60;
    public int RefreshTokenDays { get; set; } = 7;
}
