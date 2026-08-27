using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Services.Interfaces;
using Shared.DTOs;

namespace Server.Services;

/// <summary>
/// Quản lý phiên bản APK.
///   - Upload lên Azure Blob Storage
///   - Tự động set IsLatest = true và bỏ flag các bản cũ
///   - Không cho xóa bản đang là Latest
/// </summary>
public class AppReleaseService : IAppReleaseService
{
    private readonly AppDbContext        _db;
    private readonly IBlobStorageService _blob;
    private readonly ILogger<AppReleaseService> _logger;

    public AppReleaseService(AppDbContext db, IBlobStorageService blob,
        ILogger<AppReleaseService> logger)
    {
        _db     = db;
        _blob   = blob;
        _logger = logger;
    }

    public async Task<List<AppReleaseDto>> GetAllAsync()
    {
        return await _db.AppReleases
            .AsNoTracking()
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new AppReleaseDto(
                r.ReleaseId,
                r.Version,
                r.ApkUrl,
                Math.Round(r.FileSizeBytes / 1_048_576.0, 1),
                r.ReleaseNotes,
                r.MinAndroidVersion,
                r.IsLatest,
                r.CreatedAt))
            .ToListAsync();
    }

    public async Task<AppReleaseDto> UploadAsync(
        IFormFile file,
        string    version,
        string?   releaseNotes,
        string?   minAndroidVersion,
        string?   uploaderId)
    {
        if (file is null || file.Length == 0)
            throw new ArgumentException("Không có file APK nào được gửi lên.");

        if (!file.FileName.EndsWith(".apk", StringComparison.OrdinalIgnoreCase))
            throw new ArgumentException("Chỉ chấp nhận file .apk.");

        if (string.IsNullOrWhiteSpace(version))
            throw new ArgumentException("Phiên bản (version) là bắt buộc.");

        // Upload lên Azure Blob
        var blobName = $"apk/AudioGo-{version.Trim()}.apk";
        string apkUrl;
        try
        {
            using var stream = file.OpenReadStream();
            apkUrl = await _blob.UploadAsync(
                "releases", blobName, stream,
                "application/vnd.android.package-archive");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi upload APK v{Version}", version);
            throw new InvalidOperationException("Upload thất bại. Kiểm tra cấu hình Azure Blob.", ex);
        }

        // Bỏ IsLatest của tất cả bản cũ
        await _db.AppReleases
            .Where(r => r.IsLatest)
            .ExecuteUpdateAsync(s => s.SetProperty(r => r.IsLatest, false));

        var release = new AppRelease
        {
            Version            = version.Trim(),
            ApkUrl             = apkUrl,
            FileSizeBytes      = file.Length,
            ReleaseNotes       = releaseNotes,
            MinAndroidVersion  = minAndroidVersion ?? "8.0",
            IsLatest           = true,
            CreatedAt          = DateTime.UtcNow,
            CreatedByAccountId = uploaderId
        };
        _db.AppReleases.Add(release);
        await _db.SaveChangesAsync();

        return new AppReleaseDto(
            release.ReleaseId,
            release.Version,
            release.ApkUrl,
            Math.Round(release.FileSizeBytes / 1_048_576.0, 1),
            release.ReleaseNotes,
            release.MinAndroidVersion,
            release.IsLatest,
            release.CreatedAt);
    }

    public async Task DeleteAsync(string id)
    {
        var release = await _db.AppReleases.FindAsync(id)
            ?? throw new KeyNotFoundException($"Không tìm thấy release: {id}");

        if (release.IsLatest)
            throw new InvalidOperationException(
                "Không thể xóa phiên bản đang là Latest. Hãy upload bản mới trước.");

        try { await _blob.DeleteBlobByUrlAsync(release.ApkUrl); }
        catch { /* bỏ qua nếu blob đã mất */ }

        _db.AppReleases.Remove(release);
        await _db.SaveChangesAsync();
    }
}
