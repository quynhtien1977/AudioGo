using Shared.DTOs;

namespace Server.Services.Interfaces;

public interface IPoiContentService
{
    Task<List<PoiContentDto>> GetAllAsync(string poiId);
    Task<PoiContentDto> CreateAsync(string poiId, PoiContentCreateRequest req);
    Task<PoiContentDto> UpdateAsync(string poiId, string contentId, PoiContentUpdateRequest req);
    Task DeleteAsync(string poiId, string contentId);

    /// <summary>
    /// Xóa toàn bộ bản dịch phụ (IsMaster=false) của một POI.
    /// Gọi khi Master Description thay đổi để pipeline tự dịch lại + re-TTS.
    /// Không gọi SaveChangesAsync — caller tự commit.
    /// </summary>
    Task InvalidateSlavesAsync(string poiId);

    /// <summary>
    /// Chỉ cập nhật Title của các bản slave, không xóa/không đụng Description/Audio.
    /// Gọi khi chỉ Title Master thay đổi (Description giữ nguyên → không cần re-translate/re-TTS).
    /// Không gọi SaveChangesAsync — caller tự commit.
    /// </summary>
    Task UpdateSlaveTitlesAsync(string poiId, string newTitle);
}

