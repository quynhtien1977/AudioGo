namespace AudioGo.Mobile.Models
{
    /// <summary>
    /// View model tổng hợp giữa ListenHistoryEntity và PoiEntity,
    /// dùng làm ItemsSource cho CollectionView "Tiếp tục nghe".
    /// Không lưu DB — chỉ tồn tại trong memory.
    /// </summary>
    public class HistoryPoiViewModel
    {
        // ── Từ PoiEntity ───────────────────────────────────────────
        public string  PoiId         { get; init; } = string.Empty;
        public string  Title         { get; init; } = string.Empty;
        public string? LocalLogoPath { get; init; }   // Ảnh local đã cache
        public string? LogoUrl       { get; init; }   // Remote URL fallback

        // ── Từ ListenHistoryEntity ──────────────────────────────────
        public DateTime LastListenedAt      { get; init; }
        public int      TotalListenDuration { get; init; } // giây
        public bool     IsCompleted         { get; init; } // nghe xong hoàn toàn

        // ── Computed: nguồn ảnh ưu tiên offline ────────────────────
        /// <summary>
        /// Ưu tiên file local đã cache; nếu chưa download thì fallback về URL remote.
        /// </summary>
        public string? DisplayLogoSource =>
            !string.IsNullOrEmpty(LocalLogoPath) ? LocalLogoPath : LogoUrl;

        // ── Computed: progress 0..1 ─────────────────────────────────
        /// <summary>
        /// Phần trăm 0..1 để bind ProgressBar.Progress.
        /// - IsCompleted = true  → 1.0 (100%)
        /// - IsCompleted = false → tính theo thời lượng / baseline 8 phút
        ///   (sẽ chính xác hơn khi PoiEntity có AudioDurationSeconds)
        /// </summary>
        public double ProgressFraction
        {
            get
            {
                if (IsCompleted) return 1.0;
                if (TotalListenDuration <= 0) return 0;

                const int baselineSec = 480; // 8 phút
                return Math.Min(0.95, TotalListenDuration / (double)baselineSec);
                // Cap 95% — chỉ khi IsCompleted mới được 100%
            }
        }

        /// <summary>
        /// True khi đã có ghi nhận thời gian nghe (để hiện/ẩn progress overlay).
        /// </summary>
        public bool HasProgress => TotalListenDuration > 0 || IsCompleted;
    }
}
