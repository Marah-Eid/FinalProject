using Dorm.Domain.Enums;

namespace Dorm.Application.Abstractions;

/// <summary>
/// Result returned from a checkout attempt — what the controller hands back
/// to the frontend. The transaction reference is mock-generated in dev;
/// in production it'll be the CliQ payment ID.
/// </summary>
public sealed record PaymentChargeResult(
    Guid PaymentId,
    PaymentType Type,
    decimal Amount,
    PaymentStatus Status,
    string? TransactionRef);

/// <summary>
/// Platform payment service. The dev implementation (<c>MockPaymentService</c>)
/// sleeps for ~1s and returns Completed; CliQ wiring replaces this without
/// touching the application code that depends on the interface.
/// </summary>
public interface IPaymentService
{
    /// <summary>
    /// Charge the user for the given payment type. The implementation creates
    /// the Payment row, processes it, and persists the final status.
    /// </summary>
    Task<PaymentChargeResult> ChargeAsync(
        Guid userId,
        PaymentType type,
        Guid? relatedEntityId,
        CancellationToken ct);
}
