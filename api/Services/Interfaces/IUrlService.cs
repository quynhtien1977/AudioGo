namespace Server.Services.Interfaces;

/// <summary>Service để normalize URLs (especially ảnh) cho mobile app.</summary>
public interface IUrlService
{
    /// <summary>
    /// Normalize URL: nếu relative path → thêm base URL; nếu đã full URL → return ngay.
    /// </summary>
    string NormalizeUrl(string? url);

    /// <summary>Get base URL của API server (ví dụ: http://10.0.2.2:5086).</summary>
    string GetBaseUrl();
}
