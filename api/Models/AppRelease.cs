namespace Server.Models;

/// <summary>
/// Lưu metadata cho mỗi phiên bản APK đã upload lên Azure Blob.
/// Chỉ 1 bản có IsLatest=true tại một thời điểm.
/// </summary>
public class AppRelease
{
    public string  ReleaseId        { get; set; } = Guid.NewGuid().ToString();
    public string  Version          { get; set; } = null!;  // e.g. "1.2.0"
    public string  ApkUrl           { get; set; } = null!;  // Azure Blob URL
    public long    FileSizeBytes    { get; set; }
    public string? ReleaseNotes     { get; set; }
    public string  MinAndroidVersion { get; set; } = "8.0"; // Android Oreo
    public bool    IsLatest         { get; set; } = false;
    public DateTime CreatedAt       { get; set; } = DateTime.UtcNow;
    public string?  CreatedByAccountId { get; set; }
}
