namespace AudioGo.Services.Interfaces
{
    public interface IAudioService
    {
        bool IsPlaying { get; }

        /// <summary>Duration giây của track hiện tại. 0 nếu chưa phát hoặc không xác định được.</summary>
        double DurationSeconds { get; }

        /// <summary>Raised on main thread whenever IsPlaying or position changes.</summary>
        event EventHandler<AudioStateChangedEventArgs>? PlaybackStateChanged;

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

    public class AudioStateChangedEventArgs : EventArgs
    {
        public bool IsPlaying { get; init; }
        public double DurationSeconds { get; init; }
        public bool PlaybackEnded { get; init; }
    }
}
