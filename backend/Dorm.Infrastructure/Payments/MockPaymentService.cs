using Dorm.Application.Abstractions;
using Dorm.Application.Common;
using Dorm.Domain.Entities;
using Dorm.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace Dorm.Infrastructure.Payments;

/// <summary>
/// Dev/mock payment provider — always succeeds after a ~1s delay. Persists
/// the Payment row exactly the way the real CliQ wiring will, so swapping
/// implementations later is a one-line change in DI.
/// </summary>
public sealed class MockPaymentService(
    IAppDbContext db,
    ILogger<MockPaymentService> logger) : IPaymentService
{
    private static readonly TimeSpan SimulatedLatency = TimeSpan.FromSeconds(1);

    public async Task<PaymentChargeResult> ChargeAsync(
        Guid userId, PaymentType type, Guid? relatedEntityId, CancellationToken ct)
    {
        var amount = PaymentAmounts.For(type);

        var payment = new Payment
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Type = type,
            Amount = amount,
            Status = PaymentStatus.Pending,
            CreatedAt = DateTime.UtcNow,
        };
        db.Payments.Add(payment);
        await db.SaveChangesAsync(ct);

        logger.LogInformation(
            "[PAYMENT] Charging {Amount} JOD for {Type} (user {UserId}, payment {PaymentId})…",
            amount, type, userId, payment.Id);

        // Simulate the round-trip to the upstream gateway.
        await Task.Delay(SimulatedLatency, ct);

        payment.TransactionRef = $"mock_{Guid.NewGuid():N}";
        payment.Status = PaymentStatus.Completed;
        await db.SaveChangesAsync(ct);

        logger.LogInformation(
            "[PAYMENT] Completed {PaymentId} (ref {Ref})",
            payment.Id, payment.TransactionRef);

        return new PaymentChargeResult(payment.Id, payment.Type, payment.Amount, payment.Status, payment.TransactionRef);
    }
}
