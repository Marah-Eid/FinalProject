namespace Dorm.Application.Abstractions;

/// <summary>
/// Result of a successful save — the relative URL the frontend uses to fetch
/// the asset (e.g. <c>/uploads/apartments/123e4567-….jpg</c>).
/// </summary>
public sealed record StoredFile(string PublicPath, long Bytes);

/// <summary>
/// File storage abstraction. The local-disk implementation lives in
/// Dorm.Infrastructure.Storage; swap for a cloud-blob implementation later
/// by registering a different IFileStorage.
/// </summary>
public interface IFileStorage
{
    /// <summary>
    /// Persist the stream and return its public path. The caller owns the
    /// stream and should dispose it; implementations must not close it.
    /// </summary>
    /// <param name="content">File bytes.</param>
    /// <param name="originalFileName">Used only for picking an extension.</param>
    /// <param name="contentType">MIME type, validated against an allowed-list.</param>
    /// <param name="subFolder">Logical bucket — e.g. "apartments" or "avatars".</param>
    Task<StoredFile> SaveAsync(
        Stream content,
        string originalFileName,
        string contentType,
        string subFolder,
        CancellationToken ct = default);

    /// <summary>
    /// Delete a previously-saved file by its public path. No-op if missing.
    /// </summary>
    Task DeleteAsync(string publicPath, CancellationToken ct = default);
}
