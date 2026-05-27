using Dorm.Application.Abstractions;

namespace Dorm.Infrastructure.Identity;

/// <summary>
/// Recognises Jordanian university emails. Strategy:
/// 1) Explicit allow-list for the major universities the brief names.
/// 2) Catch-all for any *.edu.jo domain so smaller schools still earn the badge.
/// </summary>
public sealed class UniversityEmailDetector : IUniversityEmailDetector
{
    // Kept in sync with University enum + the brief.
    private static readonly HashSet<string> ExplicitDomains = new(StringComparer.OrdinalIgnoreCase)
    {
        "ju.edu.jo", "gju.edu.jo", "psut.edu.jo", "yu.edu.jo",
        "hu.edu.jo", "mutah.edu.jo", "zu.edu.jo", "bau.edu.jo",
        "just.edu.jo", "aau.edu.jo",
    };

    public bool IsUniversityEmail(string email)
    {
        if (string.IsNullOrWhiteSpace(email)) return false;

        var at = email.LastIndexOf('@');
        if (at <= 0 || at == email.Length - 1) return false;

        var domain = email[(at + 1)..].Trim();
        return ExplicitDomains.Contains(domain)
            || domain.EndsWith(".edu.jo", StringComparison.OrdinalIgnoreCase);
    }
}
