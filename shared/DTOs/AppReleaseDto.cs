namespace Shared.DTOs;

/// <summary>DTO cho danh sách và chi tiết phiên bản APK.</summary>
public record AppReleaseDto(
    string  ReleaseId,
    string  Version,
    string  ApkUrl,
    double  FileSizeMb,
    string? ReleaseNotes,
    string? MinAndroidVersion,
    bool    IsLatest,
    DateTime CreatedAt
);

/// <summary>Request upload APK mới.</summary>
public record AppReleaseUploadRequest(
    string  Version,
    string? ReleaseNotes,
    string? MinAndroidVersion
);
