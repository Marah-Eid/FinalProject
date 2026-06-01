using Dorm.Application.Abstractions;
using Dorm.Application.DTOs.Payments;
using Microsoft.EntityFrameworkCore;

namespace Dorm.Application.Services.Payments;

public sealed class PaymentsAppService(
    IAppDbContext db,
    IPaymentService payments) : IPaymentsAppService
{
    public async Task<PaymentDto> CheckoutAsync(Guid userId, CheckoutRequest req, CancellationToken ct)
    {
        var result = await payments.ChargeAsync(userId, req.Type, req.RelatedEntityId, ct);
        return new PaymentDto(
            result.PaymentId,
            result.Type,
            result.Amount,
            result.Status,
            result.TransactionRef,
            DateTime.UtcNow,
            result.CheckoutUrl);
    }

    public async Task<PaymentDto?> ConfirmSessionAsync(string sessionId, CancellationToken ct)
    {
        var result = await payments.ConfirmSessionAsync(sessionId, ct);
        if (result is null) return null;
        return new PaymentDto(
            result.PaymentId, result.Type, result.Amount,
            result.Status, result.TransactionRef, DateTime.UtcNow);
    }

    public Task<IReadOnlyList<PaymentDto>> GetHistoryAsync(Guid userId, CancellationToken ct) =>
        db.Payments.AsNoTracking()
            .Where(p => p.UserId == userId)
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new PaymentDto(p.Id, p.Type, p.Amount, p.Status, p.TransactionRef, p.CreatedAt, null, p.RelatedEntityId))
            .ToListAsync(ct)
            .ContinueWith(t => (IReadOnlyList<PaymentDto>)t.Result, ct);
}
