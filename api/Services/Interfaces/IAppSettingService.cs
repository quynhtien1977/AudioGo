using Shared.DTOs;

namespace Server.Services.Interfaces;

public interface IAppSettingService
{
    /// <summary>
    /// Đọc setting theo key. Ưu tiên: DB → IConfiguration fallback → defaultValue.
    /// Kết quả được cache 60s để tránh query DB mỗi request.
    /// </summary>
    Task<T> GetAsync<T>(string key, T defaultValue);

    /// <summary>Tạo hoặc cập nhật setting. Invalidate cache ngay lập tức.</summary>
    Task UpsertAsync(string key, string value, string? updatedByAccountId);

    /// <summary>Trả về tất cả settings cho CMS admin page.</summary>
    Task<List<AppSettingDto>> GetAllAsync();
}
