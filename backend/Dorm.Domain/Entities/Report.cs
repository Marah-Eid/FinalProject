using Dorm.Domain.Enums;

namespace Dorm.Domain.Entities;

/// <summary>
/// User-submitted moderation report against a listing.
/// 3 valid (status = Resolved-with-action) reports auto-suspend the listing
/// pending admin review.
/// </summary>
public class Report
{
    public Guid Id { get; set; }
    public Guid ReporterId { get; set; }
    public User Reporter { get; set; } = null!;
    public Guid ReportedApartmentId { get; set; }
    public Apartment ReportedApartment { get; set; } = null!;

    public ReportReason Reason { get; set; }
    public string? Description { get; set; }
    public ReportStatus Status { get; set; } = ReportStatus.Pending;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ResolvedAt { get; set; }
    public Guid? ResolvedByAdminId { get; set; }
    public User? ResolvedByAdmin { get; set; }
}
