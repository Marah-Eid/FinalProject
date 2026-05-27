namespace Dorm.Domain.Enums;

/// <summary>Top-level account type chosen at signup. Each user has exactly one.</summary>
public enum UserRole
{
    Student = 0,
    Owner = 1,
    Admin = 2,
}
