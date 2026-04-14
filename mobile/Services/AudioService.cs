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
        private readonly IHttpClientFactory _httpFactory;
        private readonly Queue<Func<CancellationToken, Task>> _queue = new();
        private CancellationTokenSource _cts = new();
        private bool _isProcessing;
        private IAudioPlayer? _player;
        private Stream? _currentStream;

        // Pending settings applied when next player is created
        private float _speed = 1f;

        public AudioService(IAudioManager audioManager, IHttpClientFactory httpFactory)
        {
            _audioManager = audioManager;
            _httpFactory  = httpFactory;
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
        /// <summary>
        /// Fallback chain: Local file → HTTP Stream → TTS.
        /// Nếu stream HTTP thất bại (network/timeout), tự động fallback sang TTS.
        /// </summary>
        public async Task PlayPoiAudioAsync(
            string? localAudioPath,
            string? audioUrl,
            string? fallbackText,
            string languageCode = "vi")
        {
            // Tier 1: Local file (luôn kiểm tra trước, kể cả khi offline)
            if (!string.IsNullOrEmpty(localAudioPath) && File.Exists(localAudioPath))
            {
                System.Diagnostics.Debug.WriteLine($"[AudioService] Tier1 LOCAL: {localAudioPath}");
                await PlayFileAsync(localAudioPath);
                return;
            }

            if (!string.IsNullOrEmpty(localAudioPath))
                System.Diagnostics.Debug.WriteLine($"[AudioService] Tier1 miss — file chưa tải về: {localAudioPath}");
            else
                System.Diagnostics.Debug.WriteLine($"[AudioService] Tier1 miss — không có localAudioPath");

            // Tier 2: HTTP Streaming — chỉ khi có mạng (tránh đợi timeout rồi mới biết offline)
            if (!string.IsNullOrEmpty(audioUrl))
            {
                bool hasNetwork = AudioGo.Helpers.NetworkHelper.HasInternet();

                if (hasNetwork)
                {
                    System.Diagnostics.Debug.WriteLine($"[AudioService] Tier2 STREAM: {audioUrl}");
                    await PlayFileAsync(audioUrl);
                    return;
                }
                else
                {
                    System.Diagnostics.Debug.WriteLine($"[AudioService] Tier2 miss — offline, không có local → TTS");
                }
            }

            // Tier 3: TTS — chỉ đến đây khi không có local file VÀ không có mạng để stream
            if (!string.IsNullOrEmpty(fallbackText))
            {
                System.Diagnostics.Debug.WriteLine($"[AudioService] Tier3 TTS, lang={languageCode}");
                await SpeakAsync(fallbackText, languageCode);
            }
            else
            {
                System.Diagnostics.Debug.WriteLine($"[AudioService] Không có audio nào để phát (no local, no network, no text)");
            }
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
                    // null-safe: nếu không tìm được locale tiếng Việt thì dùng system default (null)
                    // thay vì throw OperationCanceledException hay dùng English voice.
                    var locales = await TextToSpeech.Default.GetLocalesAsync();
                    var locale  = locales?.FirstOrDefault(l =>
                        l.Language.StartsWith(languageCode, StringComparison.OrdinalIgnoreCase));
                    if (locale is null)
                        System.Diagnostics.Debug.WriteLine($"[AudioService] TTS locale '{languageCode}' not found, using system default");
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
                    Stream? localStream = null;
                    DisposePlayer();

                    if (urlOrPath.StartsWith("http", StringComparison.OrdinalIgnoreCase))
                    {
                        var http = _httpFactory.CreateClient("downloader");
                        localStream = await http.GetStreamAsync(urlOrPath, ct);
                    }
                    else
                    {
                        if (!File.Exists(urlOrPath)) return;
                        localStream = File.OpenRead(urlOrPath);
                    }

                    _currentStream = localStream;
                    _player = _audioManager.CreatePlayer(localStream);
                    _player.Speed = _speed;
                    _player.Loop  = false;
                    DurationSeconds = _player.Duration > 0 ? _player.Duration : 0;
                    RaiseStateChanged(isPlaying: true); // fire again with Duration

                    var tcs = new TaskCompletionSource();
                    _player.PlaybackEnded += (s, e) => tcs.TrySetResult();
                    ct.Register(() =>
                    {
                        try { _player?.Stop(); } catch (Exception ex) { System.Diagnostics.Debug.WriteLine($"[AudioService] Error stopping player: {ex.Message}"); }
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
                catch (Exception ex)
                {
                    System.Diagnostics.Debug.WriteLine($"[AudioService] Error playing {urlOrPath}: {ex.Message}");
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
            try { _player.Pause(); } catch (Exception ex) { System.Diagnostics.Debug.WriteLine($"[AudioService] Error pausing player: {ex.Message}"); }
            RaiseStateChanged(isPlaying: false, isPaused: true);
            return Task.CompletedTask;
        }

        public Task ResumeAsync()
        {
            if (_player is null || !IsPaused) return Task.CompletedTask;
            try { _player.Play(); } catch (Exception ex) { System.Diagnostics.Debug.WriteLine($"[AudioService] Error playing player: {ex.Message}"); }
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
                try { _player.Speed = speed; } catch (Exception ex) { System.Diagnostics.Debug.WriteLine($"[AudioService] Error setting speed: {ex.Message}"); }
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
            catch (Exception ex) { System.Diagnostics.Debug.WriteLine($"[AudioService] Plugin may not support seek: {ex.Message}"); }
            return Task.CompletedTask;
        }

        // ── Helpers ────────────────────────────────────────────────
        private void DisposePlayer()
        {
            if (_player is not null)
            {
                try { _player.Stop(); }    catch (Exception ex) { System.Diagnostics.Debug.WriteLine($"[AudioService] Error stopping in Dispose: {ex.Message}"); }
                try { _player.Dispose(); } catch (Exception ex) { System.Diagnostics.Debug.WriteLine($"[AudioService] Error disposing player: {ex.Message}"); }
                _player = null;
            }
            if (_currentStream is not null)
            {
                try { _currentStream.Dispose(); } catch (Exception ex) { System.Diagnostics.Debug.WriteLine($"[AudioService] Error disposing stream: {ex.Message}"); }
                _currentStream = null;
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
                catch (Exception ex) { System.Diagnostics.Debug.WriteLine($"[AudioService] Error processing playback queue: {ex.Message}"); }
            }
            _isProcessing = false;
        }
    }
}
