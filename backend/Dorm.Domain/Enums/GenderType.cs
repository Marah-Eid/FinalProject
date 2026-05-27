namespace Dorm.Domain.Enums;

/// <summary>
/// Per-apartment gender policy set by the owner. Default in the UI is single-gender
/// (MaleOnly / FemaleOnly) reflecting the typical norm in Jordan.
/// Drives the API-level visibility filter: male students see MaleOnly+Mixed,
/// female students see FemaleOnly+Mixed.
/// </summary>
public enum GenderType
{
    MaleOnly = 0,
    FemaleOnly = 1,
    Mixed = 2,
}
