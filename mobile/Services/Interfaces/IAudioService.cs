namespace AudioGo.Services.Interfaces
{
    public interface IAudioService
    {
        bool IsPlaying  { get; }
        bool IsPaused   { get; }

        /// <summary>Duration giây của track hiện tại. 0 nếu chưa phát hoặc không xác định được.</summary>
        double DurationSeconds { get; }

        /// <summary>Current playback position in seconds.</summary>
        double CurrentPositionSeconds { get; }

        /// <summary>Raised on main thread whenever playback state changes.</summary>
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

        /// <summary>Pause playback — position is preserved.</summary>
        Task PauseAsync();

        /// <summary>Resume from paused position.</summary>
        Task ResumeAsync();

        /// <summary>Full stop — resets position to zero.</summary>
        Task StopAsync();

        /// <summary>Set playback speed multiplier (0.5 – 2.0). No-op for TTS.</summary>
        void SetSpeed(float speed);

        /// <summary>Seek to a specific position in seconds. No-op for TTS or if not playing/paused.</summary>
        Task SeekAsync(double positionSeconds);
    }

    public class AudioStateChangedEventArgs : EventArgs
    {
        public bool IsPlaying      { get; init; }
        public bool IsPaused       { get; init; }
        public double DurationSeconds { get; init; }
        public bool PlaybackEnded  { get; init; }
    }
}
