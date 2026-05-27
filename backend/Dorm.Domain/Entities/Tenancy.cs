using Dorm.Domain.Enums;

namespace Dorm.Domain.Entities;

/// <summary>
/// Created when an Application is accepted. The set of Active tenancies for an
/// apartment is what the compatibility algorithm averages over.
/// </summary>
public class Tenancy
{
    public Guid Id { get; set; }
    public Guid ApartmentId { get; set; }
    public Apartment Apartment { get; set; } = null!;
    public Guid StudentId { get; set; }
    public User Student { get; set; } = null!;

    public DateTime StartDate { get; set; } = DateTime.UtcNow;
    public DateTime? EndDate { get; set; }
    public TenancyStatus Status { get; set; } = TenancyStatus.Active;
}
