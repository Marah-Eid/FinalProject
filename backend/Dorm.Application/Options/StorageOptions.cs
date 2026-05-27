namespace Dorm.Application.Options;

/// <summary>
/// Config for IFileStorage. The brief uses local file storage for dev; the
/// shape is the same for the cloud implementation.
/// </summary>
public sealed class StorageOptions
{
    public const string SectionName = "Storage";

    /// <summary>"Local" for now; later "Cloudinary" / "AzureBlob".</summary>
    public string Provider { get; set; } = "Local";

    /// <summary>Filesystem root, relative to ContentRoot when provider=Local.</summary>
    public string LocalRoot { get; set; } = "wwwroot/uploads";

    /// <summary>Public URL prefix served from the API host.</summary>
    public string PublicBaseUrl { get; set; } = "/uploads";

    /// <summary>Max single-file size in bytes (default 5 MB).</summary>
    public long MaxBytes { get; set; } = 5 * 1024 * 1024;

    /// <summary>Allowed image MIME types for photo uploads.</summary>
    public string[] AllowedImageContentTypes { get; set; } =
        { "image/jpeg", "image/png", "image/webp" };
}
