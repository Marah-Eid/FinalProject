using Dorm.Domain.Enums;

namespace Dorm.Domain.Entities;

/// <summary>
/// A student's request to join an apartment. CompatibilityScore is snapshotted
/// at submission time so the owner sees what the student saw.
/// </summary>
public class Application
{
    public Guid Id { get; set; }
    public Guid ApartmentId { get; set; }
    public Apartment Apartment { get; set; } = null!;
    public Guid StudentId { get; set; }
    public User Student { get; set; } = null!;

    public required string Message { get; set; }
    public int CompatibilityScore { get; set; }
    public ApplicationStatus Status { get; set; } = ApplicationStatus.Pending;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? RespondedAt { get; set; }
}
