using AudioGo.Services.Interfaces;

namespace AudioGo.Services
{
    /// <summary>
    /// Phát audio: TTS (Text-to-Speech) hoặc file audio từ URL/local path.
    /// Xếp hàng (queue) để tránh overlap khi nhiều POI trigger cùng lúc.
    /// </summary>
    public class AudioService : IAudioService
    {
        private readonly Queue<Func<CancellationToken, Task>> _queue = new();
        private CancellationTokenSource _cts = new();
        private bool _isProcessing;

        public bool IsPlaying { get; private set; }

        public async Task SpeakAsync(string text, string languageCode = "vi")
        {
            Enqueue(async ct =>
            {
                IsPlaying = true;
                var locale = (await TextToSpeech.Default.GetLocalesAsync())
                    .FirstOrDefault(l => l.Language.StartsWith(languageCode));
                await TextToSpeech.Default.SpeakAsync(text,
                    new SpeechOptions { Locale = locale }, ct);
                IsPlaying = false;
            });
        }

        public Task PlayFileAsync(string urlOrPath)
        {
            // Placeholder: tích hợp MediaElement khi có UI (Sprint 3)
            return SpeakAsync($"Đang phát: {Path.GetFileNameWithoutExtension(urlOrPath)}");
        }

        public async Task StopAsync()
        {
            await _cts.CancelAsync();
            _queue.Clear();
            _cts = new CancellationTokenSource();
            IsPlaying = false;
        }

        private void Enqueue(Func<CancellationToken, Task> action)
        {
            _queue.Enqueue(action);
            if (!_isProcessing)
                _ = ProcessQueueAsync();
        }

        private async Task ProcessQueueAsync()
        {
            _isProcessing = true;
            while (_queue.TryDequeue(out var action))
            {
                try { await action(_cts.Token); }
                catch (OperationCanceledException) { break; }
                catch { /* log lỗi playback */ }
            }
            _isProcessing = false;
        }
    }
}
