using AudioGo.Services.Interfaces;
using Plugin.Maui.Audio;

namespace AudioGo.Services
{
    /// <summary>
    /// Phát audio: TTS hoặc file audio từ URL/local path.
    /// Hỗ trợ Pause/Resume (giữ vị trí) và Speed.
    /// Raise <see cref="PlaybackStateChanged"/> mỗi khi trạng thái thay đổi.
    /// </summary>
    public class AudioService : IAudioService
    {
        private readonly IAudioManager _audioManager;
        private readonly Queue<Func<CancellationToken, Task>> _queue = new();
        private CancellationTokenSource _cts = new();
        private bool _isProcessing;
        private IAudioPlayer? _player;

        // Pending settings applied when next player is created
        private float _speed = 1f;

        public AudioService(IAudioManager audioManager)
        {
            _audioManager = audioManager;
        }

        // ── State ──────────────────────────────────────────────────
        public bool IsPlaying { get; private set; }
        public bool IsPaused  { get; private set; }
        public double DurationSeconds        { get; private set; }
        public double CurrentPositionSeconds => _player?.CurrentPosition ?? 0;

        // ── Event ──────────────────────────────────────────────────
        public event EventHandler<AudioStateChangedEventArgs>? PlaybackStateChanged;

        private void RaiseStateChanged(bool isPlaying, bool isPaused = false, bool ended = false)
        {
            IsPlaying = isPlaying;
            IsPaused  = isPaused;
            MainThread.BeginInvokeOnMainThread(() =>
                PlaybackStateChanged?.Invoke(this, new AudioStateChangedEventArgs
                {
                    IsPlaying      = isPlaying,
                    IsPaused       = isPaused,
                    DurationSeconds = DurationSeconds,
                    PlaybackEnded  = ended
                }));
        }

        // ── 3-tier fallback helper ─────────────────────────────────
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

        // ── TTS ────────────────────────────────────────────────────
        public async Task SpeakAsync(string text, string languageCode = "vi")
        {
            Enqueue(async ct =>
            {
                RaiseStateChanged(isPlaying: true);
                try
                {
                    DurationSeconds = 0; // TTS duration unknown
                    var locale = (await TextToSpeech.Default.GetLocalesAsync())
                        .FirstOrDefault(l => l.Language.StartsWith(languageCode));
                    await TextToSpeech.Default.SpeakAsync(text,
                        new SpeechOptions { Locale = locale, Volume = 1f, Pitch = _speed }, ct);
                }
                finally
                {
                    RaiseStateChanged(isPlaying: false, ended: true);
                }
            });
        }

        // ── File/URL player ────────────────────────────────────────
        public Task PlayFileAsync(string? urlOrPath)
        {
            if (string.IsNullOrEmpty(urlOrPath)) return Task.CompletedTask;

            Enqueue(async ct =>
            {
                RaiseStateChanged(isPlaying: true);
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
                        if (!File.Exists(urlOrPath)) return;
                        stream = File.OpenRead(urlOrPath);
                    }

                    _player = _audioManager.CreatePlayer(stream);
                    _player.Speed = _speed;
                    _player.Loop  = false;
                    DurationSeconds = _player.Duration > 0 ? _player.Duration : 0;
                    RaiseStateChanged(isPlaying: true); // fire again with Duration

                    var tcs = new TaskCompletionSource();
                    _player.PlaybackEnded += (s, e) => tcs.TrySetResult();
                    ct.Register(() =>
                    {
                        // Cancellation = full stop; PauseAsync handles pause without cancel
                        try { _player?.Stop(); } catch { }
                        tcs.TrySetCanceled();
                    });

                    _player.Play();
                    await tcs.Task;
                }
                catch (OperationCanceledException) { /* stopped externally */ }
                catch (FileNotFoundException)
                {
                    System.Diagnostics.Debug.WriteLine($"[AudioService] File not found: {urlOrPath}");
                }
                finally
                {
                    if (!IsPaused)
                        RaiseStateChanged(isPlaying: false, ended: true);
                }
            });
            return Task.CompletedTask;
        }

        // ── Pause / Resume ─────────────────────────────────────────
        public Task PauseAsync()
        {
            if (_player is null || !IsPlaying || IsPaused) return Task.CompletedTask;
            try { _player.Pause(); } catch { }
            RaiseStateChanged(isPlaying: false, isPaused: true);
            return Task.CompletedTask;
        }

        public Task ResumeAsync()
        {
            if (_player is null || !IsPaused) return Task.CompletedTask;
            try { _player.Play(); } catch { }
            IsPaused = false;
            RaiseStateChanged(isPlaying: true, isPaused: false);
            return Task.CompletedTask;
        }

        // ── Full Stop ──────────────────────────────────────────────
        public async Task StopAsync()
        {
            IsPaused = false;
            await _cts.CancelAsync();
            _queue.Clear();
            DisposePlayer();
            _cts = new CancellationTokenSource();
            DurationSeconds = 0;
            RaiseStateChanged(isPlaying: false);
        }

        // ── Speed / Loop ───────────────────────────────────────────
        public void SetSpeed(float speed)
        {
            _speed = speed;
            if (_player is not null)
            {
                try { _player.Speed = speed; } catch { }
            }
        }

        // ── Seek ────────────────────────────────────────────────────
        public Task SeekAsync(double positionSeconds)
        {
            if (_player is null) return Task.CompletedTask; // TTS mode — no seek
            try
            {
                _player.Seek(positionSeconds);
            }
            catch { /* Plugin may not support all formats — swallow */ }
            return Task.CompletedTask;
        }

        // ── Helpers ────────────────────────────────────────────────
        private void DisposePlayer()
        {
            if (_player is not null)
            {
                try { _player.Stop(); }    catch { }
                try { _player.Dispose(); } catch { }
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
