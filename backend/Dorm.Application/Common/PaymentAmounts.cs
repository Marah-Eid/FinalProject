using Dorm.Domain.Enums;

namespace Dorm.Application.Common;

/// <summary>
/// Fixed JOD amounts for each platform payment, per the brief.
/// Centralised so the figure 15/10/2 only appears in one place.
/// </summary>
public static class PaymentAmounts
{
    public const decimal MatchCommission   = 15m;
    public const decimal FeaturedListing   = 10m;
    public const decimal VerifiedBadgeMonth = 2m;

    public static decimal For(PaymentType type) => type switch
    {
        PaymentType.MatchCommission   => MatchCommission,
        PaymentType.FeaturedListing   => FeaturedListing,
        PaymentType.VerifiedBadge     => VerifiedBadgeMonth,
        _ => throw new ArgumentOutOfRangeException(nameof(type), type, "Unsupported payment type."),
    };
}
