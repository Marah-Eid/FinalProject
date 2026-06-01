using Dorm.Domain.Enums;

namespace Dorm.Application.Abstractions;

/// <summary>
/// Result returned from a checkout attempt. For Stripe, <see cref="CheckoutUrl"/>
/// contains the hosted checkout page URL. For the mock provider it is null and
/// the payment is already Completed.
/// </summary>
public sealed record PaymentChargeResult(
    Guid PaymentId,
    PaymentType Type,
    decimal Amount,
    PaymentStatus Status,
    string? TransactionRef,
    string? CheckoutUrl = null);

/// <summary>
/// Platform payment service. Implementations: <c>StripePaymentService</c> (live)
/// and <c>MockPaymentService</c> (dev fallback).
/// </summary>
public interface IPaymentService
{
    Task<PaymentChargeResult> ChargeAsync(
        Guid userId,
        PaymentType type,
        Guid? relatedEntityId,
        CancellationToken ct);

    /// <summary>
    /// Called when Stripe redirects the user back after a successful payment.
    /// Verifies the session and marks the payment as Completed.
    /// Returns null if the session is invalid or already processed.
    /// </summary>
    Task<PaymentChargeResult?> ConfirmSessionAsync(string sessionId, CancellationToken ct);
}
