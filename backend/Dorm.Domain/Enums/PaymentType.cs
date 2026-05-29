namespace Dorm.Domain.Enums;

/// <summary>
/// Payment buckets used by IPaymentService. Amounts are fixed by the brief
/// (defined in PaymentAmounts in the Application layer).
/// </summary>
public enum PaymentType
{
    /// <summary>15 JOD paid by a student when their application is accepted.</summary>
    MatchCommission = 0,
    /// <summary>10 JOD paid by an owner to list an apartment (first listing is free).</summary>
    ListingFee = 1,
    /// <summary>2 JOD/month subscription for the "Verified" badge.</summary>
    VerifiedBadge = 2,
}
