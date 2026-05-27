namespace Dorm.Application.Options;

/// <summary>App-level config — the frontend's public URL, used to build links inside emails.</summary>
public sealed class AppOptions
{
    public const string SectionName = "App";
    public string FrontendBaseUrl { get; set; } = "http://localhost:5173";
}
