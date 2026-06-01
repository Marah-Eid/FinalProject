using Dorm.Application.Abstractions;
using Dorm.Application.Common;
using Dorm.Application.Options;
using Dorm.Domain.Entities;
using Dorm.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Stripe;
using Stripe.Checkout;

namespace Dorm.Infrastructure.Payments;

public sealed class StripePaymentService(
    IAppDbContext db,
    IOptions<StripeOptions> opts,
    ILogger<StripePaymentService> logger) : IPaymentService
{
    private static readonly Dictionary<PaymentType, string> TypeLabels = new()
    {
        [PaymentType.MatchCommission] = "Match Commission",
        [PaymentType.ListingFee] = "Listing Fee",
        [PaymentType.VerifiedBadge] = "Verified Badge",
    };

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

        var options = new SessionCreateOptions
        {
            PaymentMethodTypes = ["card"],
            LineItems =
            [
                new SessionLineItemOptions
                {
                    PriceData = new SessionLineItemPriceDataOptions
                    {
                        Currency = "usd",
                        UnitAmount = (long)(amount * 100),
                        ProductData = new SessionLineItemPriceDataProductDataOptions
                        {
                            Name = TypeLabels.GetValueOrDefault(type, "Dorm Payment"),
                        },
                    },
                    Quantity = 1,
                },
            ],
            Mode = "payment",
            SuccessUrl = opts.Value.SuccessUrl,
            CancelUrl = opts.Value.CancelUrl,
            Metadata = new Dictionary<string, string>
            {
                ["paymentId"] = payment.Id.ToString(),
                ["userId"] = userId.ToString(),
                ["type"] = type.ToString(),
            },
        };

        var client = new StripeClient(opts.Value.SecretKey);
        var service = new SessionService(client);
        var session = await service.CreateAsync(options, cancellationToken: ct);

        payment.TransactionRef = session.Id;
        await db.SaveChangesAsync(ct);

        logger.LogInformation(
            "[STRIPE] Created checkout session {SessionId} for {Type} ({Amount} JOD, user {UserId})",
            session.Id, type, amount, userId);

        return new PaymentChargeResult(
            payment.Id, payment.Type, payment.Amount,
            PaymentStatus.Pending, session.Id, session.Url);
    }

    public async Task<PaymentChargeResult?> ConfirmSessionAsync(string sessionId, CancellationToken ct)
    {
        var payment = await db.Payments
            .FirstOrDefaultAsync(p => p.TransactionRef == sessionId, ct);

        if (payment is null || payment.Status == PaymentStatus.Completed)
            return payment is null
                ? null
                : new PaymentChargeResult(payment.Id, payment.Type, payment.Amount, payment.Status, payment.TransactionRef);

        var client = new StripeClient(opts.Value.SecretKey);
        var service = new SessionService(client);
        var session = await service.GetAsync(sessionId, cancellationToken: ct);

        if (session.PaymentStatus == "paid")
        {
            payment.Status = PaymentStatus.Completed;
            await db.SaveChangesAsync(ct);

            logger.LogInformation(
                "[STRIPE] Payment {PaymentId} confirmed (session {SessionId})",
                payment.Id, sessionId);
        }

        return new PaymentChargeResult(
            payment.Id, payment.Type, payment.Amount, payment.Status, payment.TransactionRef);
    }
}
