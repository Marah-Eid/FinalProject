namespace Dorm.Domain.Enums;

/// <summary>
/// Captured at signup for students. Used to filter apartments at the API level
/// (male → MaleOnly + Mixed, female → FemaleOnly + Mixed) — never used as a quiz answer
/// or browse filter.
/// </summary>
public enum Gender
{
    Male = 0,
    Female = 1,
}
