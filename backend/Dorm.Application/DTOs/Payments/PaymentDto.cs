using Dorm.Domain.Enums;

namespace Dorm.Application.DTOs.Payments;

public sealed record PaymentDto(
    Guid Id,
    PaymentType Type,
    decimal Amount,
    PaymentStatus Status,
    string? TransactionRef,
    DateTime CreatedAt);

public sealed record CheckoutRequest(
    PaymentType Type,
    Guid? RelatedEntityId);
