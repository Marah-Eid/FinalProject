using Dorm.Domain.Enums;

namespace Dorm.Domain.Entities;

/// <summary>
/// A platform payment record. Created via the mocked IPaymentService —
/// CliQ wiring is a follow-up. Amount values are fixed by the brief
/// (see PaymentAmounts in the Application layer).
/// </summary>
public class Payment
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public PaymentType Type { get; set; }
    public decimal Amount { get; set; }
    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;
    /// <summary>Optional link to the entity this payment covers (e.g. apartment ID for ListingFee).</summary>
    public Guid? RelatedEntityId { get; set; }
    /// <summary>External transaction reference (mock value for now).</summary>
    public string? TransactionRef { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
