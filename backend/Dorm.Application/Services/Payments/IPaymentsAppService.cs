using Dorm.Application.DTOs.Payments;

namespace Dorm.Application.Services.Payments;

/// <summary>
/// Thin wrapper over <see cref="Dorm.Application.Abstractions.IPaymentService"/>
/// that exposes the user-facing concerns (history list) on top of the bare
/// "charge" primitive.
/// </summary>
public interface IPaymentsAppService
{
    Task<PaymentDto> CheckoutAsync(Guid userId, CheckoutRequest req, CancellationToken ct);

    Task<PaymentDto?> ConfirmSessionAsync(string sessionId, CancellationToken ct);

    Task<IReadOnlyList<PaymentDto>> GetHistoryAsync(Guid userId, CancellationToken ct);
}
