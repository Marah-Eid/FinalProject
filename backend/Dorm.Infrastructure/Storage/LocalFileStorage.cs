using Dorm.Application.Abstractions;
using Dorm.Application.Common.Exceptions;
using Dorm.Application.Options;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Dorm.Infrastructure.Storage;

/// <summary>
/// Writes uploads under <c>{ContentRoot}/{Storage.LocalRoot}/{subFolder}/{guid}{ext}</c>
/// and returns a public path the client can request directly because we map
/// <c>{Storage.PublicBaseUrl}</c> to the same folder via UseStaticFiles.
/// </summary>
public sealed class LocalFileStorage(
    IOptions<StorageOptions> options,
    IHostEnvironment env,
    ILogger<LocalFileStorage> logger) : IFileStorage
{
    private readonly StorageOptions _opts = options.Value;

    public async Task<StoredFile> SaveAsync(
        Stream content,
        string originalFileName,
        string contentType,
        string subFolder,
        CancellationToken ct = default)
    {
        if (!_opts.AllowedImageContentTypes.Contains(contentType, StringComparer.OrdinalIgnoreCase))
        {
            throw new BadRequestException(
                $"Unsupported content type '{contentType}'. " +
                $"Allowed: {string.Join(", ", _opts.AllowedImageContentTypes)}.");
        }

        var safeSub = SanitizeSegment(subFolder);
        var rootAbs = Path.Combine(env.ContentRootPath, _opts.LocalRoot, safeSub);
        Directory.CreateDirectory(rootAbs);

        var ext = Path.GetExtension(originalFileName);
        if (string.IsNullOrWhiteSpace(ext)) ext = ContentTypeToExt(contentType);
        ext = SanitizeSegment(ext.Trim('.'));

        var fileName = $"{Guid.NewGuid():N}.{ext}";
        var absPath = Path.Combine(rootAbs, fileName);

        await using var fs = File.Create(absPath);

        // Cap the bytes copied so an attacker can't fill the disk.
        var bytes = await CopyWithLimitAsync(content, fs, _opts.MaxBytes, ct);

        var publicPath = $"{_opts.PublicBaseUrl.TrimEnd('/')}/{safeSub}/{fileName}";
        logger.LogInformation("Saved upload {Path} ({Bytes} bytes)", publicPath, bytes);
        return new StoredFile(publicPath, bytes);
    }

    public Task DeleteAsync(string publicPath, CancellationToken ct = default)
    {
        // Translate the public URL back to the local path under our upload root.
        var prefix = _opts.PublicBaseUrl.TrimEnd('/') + "/";
        if (!publicPath.StartsWith(prefix, StringComparison.Ordinal))
        {
            logger.LogWarning("Refusing to delete {Path}: outside upload root.", publicPath);
            return Task.CompletedTask;
        }

        var rel = publicPath[prefix.Length..];
        var absPath = Path.Combine(env.ContentRootPath, _opts.LocalRoot, rel);

        if (File.Exists(absPath))
        {
            File.Delete(absPath);
            logger.LogInformation("Deleted upload {Path}", publicPath);
        }
        return Task.CompletedTask;
    }

    // ── helpers ─────────────────────────────────────────────────────────────

    private static string SanitizeSegment(string s) =>
        new string(s.Where(ch => char.IsLetterOrDigit(ch) || ch is '-' or '_').ToArray());

    private static string ContentTypeToExt(string ct) => ct.ToLowerInvariant() switch
    {
        "image/jpeg" => "jpg",
        "image/png"  => "png",
        "image/webp" => "webp",
        _ => "bin",
    };

    private static async Task<long> CopyWithLimitAsync(Stream source, Stream dest, long maxBytes, CancellationToken ct)
    {
        var buffer = new byte[81920];
        long total = 0;
        int read;
        while ((read = await source.ReadAsync(buffer.AsMemory(0, buffer.Length), ct)) > 0)
        {
            total += read;
            if (total > maxBytes)
                throw new BadRequestException($"File exceeds the maximum allowed size of {maxBytes} bytes.");
            await dest.WriteAsync(buffer.AsMemory(0, read), ct);
        }
        return total;
    }
}
