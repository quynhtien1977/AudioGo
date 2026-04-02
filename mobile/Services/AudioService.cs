using AudioGo.Services.Interfaces;
using Plugin.Maui.Audio;

namespace AudioGo.Services
{
    /// <summary>
    /// Phát audio: TTS (Text-to-Speech) hoặc file audio từ URL/local path.
    /// Xếp hàng (queue) để tránh overlap khi nhiều POI trigger cùng lúc.
    /// </summary>
    public class AudioService : IAudioService
    {
        private readonly IAudioManager _audioManager;
        private readonly Queue<Func<CancellationToken, Task>> _queue = new();
        private CancellationTokenSource _cts = new();
        private bool _isProcessing;
        private IAudioPlayer? _player;

        public AudioService(IAudioManager audioManager)
        {
            _audioManager = audioManager;
        }

        public bool IsPlaying { get; private set; }

        /// <summary>
        /// 3-tier fallback: local file → HTTP stream → device TTS
        /// </summary>
        public Task PlayPoiAudioAsync(
            string? localAudioPath,
            string? audioUrl,
            string? fallbackText,
            string languageCode = "vi")
        {
            if (!string.IsNullOrEmpty(localAudioPath) && File.Exists(localAudioPath))
                return PlayFileAsync(localAudioPath);

            if (!string.IsNullOrEmpty(audioUrl))
                return PlayFileAsync(audioUrl);

            if (!string.IsNullOrEmpty(fallbackText))
                return SpeakAsync(fallbackText, languageCode);

            return Task.CompletedTask;
        }

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
            Enqueue(async ct =>
            {
                IsPlaying = true;
                try
                {
                    DisposePlayer();

                    Stream stream;
                    if (urlOrPath.StartsWith("http", StringComparison.OrdinalIgnoreCase))
                    {
                        using var http = new HttpClient();
                        var data = await http.GetByteArrayAsync(urlOrPath, ct);
                        stream = new MemoryStream(data);
                    }
                    else
                    {
                        stream = File.OpenRead(urlOrPath);
                    }

                    _player = _audioManager.CreatePlayer(stream);
                    var tcs = new TaskCompletionSource();

                    _player.PlaybackEnded += (s, e) => tcs.TrySetResult();
                    ct.Register(() =>
                    {
                        _player.Stop();
                        tcs.TrySetCanceled();
                    });

                    _player.Play();
                    await tcs.Task;
                }
                finally
                {
                    IsPlaying = false;
                }
            });
            return Task.CompletedTask;
        }

        public async Task StopAsync()
        {
            await _cts.CancelAsync();
            _queue.Clear();
            DisposePlayer();
            _cts = new CancellationTokenSource();
            IsPlaying = false;
        }

        private void DisposePlayer()
        {
            if (_player is not null)
            {
                _player.Stop();
                _player.Dispose();
                _player = null;
            }
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
