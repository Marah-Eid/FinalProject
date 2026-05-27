namespace Dorm.Application.DTOs.Apartments;

/// <summary>
/// Per the privacy rule: current-tenants on the apartment detail page show
/// FIRST NAME ONLY + year + major. No profile photo. No last name. No email.
/// CompatibilityScore is populated for logged-in students (Phase 5).
/// </summary>
public sealed record CurrentTenantDto(
    string FirstName,
    int? Year,
    string? Major,
    int? CompatibilityScore);
