namespace AudioGo.Services.Interfaces
{
    public interface IAudioService
    {
        bool IsPlaying { get; }

        /// <summary>
        /// Phát audio POI với 3-tier fallback:
        /// local file → HTTP stream → device TTS.
        /// </summary>
        Task PlayPoiAudioAsync(
            string? localAudioPath,
            string? audioUrl,
            string? fallbackText,
            string languageCode = "vi");

        Task PlayFileAsync(string urlOrPath);
        Task SpeakAsync(string text, string languageCode = "vi");
        Task StopAsync();
    }
}
