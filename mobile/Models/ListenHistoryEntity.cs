using SQLite;

namespace AudioGo.Mobile.Models
{
    /// <summary>
    /// Local SQLite cache cho section "Tiếp tục nghe" trên trang chủ.
    /// Mỗi row = 1 POI duy nhất; được upsert sau mỗi lần nghe.
    /// Title / LogoUrl KHÔNG lưu ở đây — lấy từ PoiEntity khi cần.
    ///
    /// Schema v3 (2026-05-20):
    ///   - Bỏ Title, LogoUrl (v1 redundant fields)
    ///   - Thêm IsCompleted để track audio nghe hết (v3)
    /// </summary>
    [Table("ListenHistory")]
    public class ListenHistoryEntity
    {
        [PrimaryKey]
        [Column("poi_id")]
        public string PoiId { get; set; } = string.Empty;

        /// <summary>UTC ticks của lần nghe gần nhất (dùng để sort).</summary>
        [Column("last_listened_at_ticks")]
        public long LastListenedAtTicks { get; set; }

        [Ignore]
        public DateTime LastListenedAt
        {
            get => new DateTime(LastListenedAtTicks, DateTimeKind.Utc);
            set => LastListenedAtTicks = value.Ticks;
        }

        /// <summary>Tổng thời gian đã nghe (giây) – dùng để hiện progress.</summary>
        [Column("total_listen_duration")]
        public int TotalListenDuration { get; set; }

        /// <summary>
        /// True khi audio đã phát xong hoàn toàn (không bị dừng giữa chừng).
        /// Khi true → ProgressBar hiện 100%, không cần tính theo duration.
        /// </summary>
        [Column("is_completed")]
        public bool IsCompleted { get; set; }
    }
}
