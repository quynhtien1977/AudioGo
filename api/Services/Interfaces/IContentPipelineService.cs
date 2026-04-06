using Server.Models;

namespace Server.Services.Interfaces;

public interface IContentPipelineService
{
    /// <summary>
    /// Đảm bảo POI có content cho ngôn ngữ đích.
    /// Nếu chưa có → translate + TTS + upload blob + save DB.
    /// </summary>
    Task<PoiContent> EnsureContentAsync(Poi poi, string targetLang);

    /// <summary>
    /// Generate audio (TTS) cho content đã tồn tại nhưng chưa có AudioUrl.
    /// Dùng khi seed data đã có text nhưng thiếu file âm thanh.
    /// </summary>
    Task<PoiContent> GenerateAudioAsync(PoiContent content);
}
