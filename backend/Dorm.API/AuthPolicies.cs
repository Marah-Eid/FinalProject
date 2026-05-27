namespace Dorm.API;

/// <summary>String-keyed authorization policies — keep callers off magic strings.</summary>
public static class AuthPolicies
{
    public const string Student = nameof(Student);
    public const string Owner = nameof(Owner);
    public const string Admin = nameof(Admin);
}
