using AudioGo.Helpers;
using AudioGo.Models;
using AudioGo.Mobile.Models;
using SQLite;

namespace AudioGo.Data
{
    public class AppDatabase
    {
        private readonly SQLiteAsyncConnection _db;
        private Task? _initTask;

        public AppDatabase(string dbPath)
        {
            _db = new SQLiteAsyncConnection(dbPath,
                SQLiteOpenFlags.ReadWrite | SQLiteOpenFlags.Create | SQLiteOpenFlags.SharedCache);
        }

        public Task InitAsync() => _initTask ??= DoInitAsync();

        // Tăng số này mỗi khi thay đổi schema ListenHistory
        private const int ListenHistorySchemaVersion = 3;
        private const string VersionKey = "listen_history_schema_ver";

        private async Task DoInitAsync()
        {
            await _db.CreateTableAsync<PoiEntity>();
            await _db.CreateTableAsync<TourEntity>();
            await _db.CreateTableAsync<ArticleEntity>();

            // Migration: nếu schema version cũ → xóa bảng và tạo lại
            bool needRebuild = await NeedsListenHistoryRebuildAsync();
            if (needRebuild)
            {
                await _db.ExecuteAsync("DROP TABLE IF EXISTS ListenHistory");
                #if DEBUG
                System.Diagnostics.Debug.WriteLine("[DB] ListenHistory schema upgraded — table recreated.");
                #endif
            }
            await _db.CreateTableAsync<ListenHistoryEntity>();

            if (needRebuild)
            {
                // Ghi version mới vào bảng tạm (dùng SQLite user_version)
                await _db.ExecuteAsync($"PRAGMA user_version = {ListenHistorySchemaVersion}");
            }
        }

        private async Task<bool> NeedsListenHistoryRebuildAsync()
        {
            try
            {
                // Đọc user_version pragma
                var rows = await _db.QueryAsync<PragmaRow>("PRAGMA user_version");
                int current = rows.FirstOrDefault()?.user_version ?? 0;
                if (current < ListenHistorySchemaVersion) return true;

                // Kiểm tra có column is_completed chưa (phòng trường hợp pragma không đáng tin)
                var cols = await _db.QueryAsync<TableInfoRow>("PRAGMA table_info(ListenHistory)");
                return !cols.Any(c => c.name == "is_completed");
            }
            catch
            {
                return true; // Lỗi không đọc được → rebuild cho an toàn
            }
        }

        private Task EnsureInitAsync() => _initTask ?? InitAsync();

        public async Task<List<PoiEntity>> GetAllPoisAsync()
        {
            await EnsureInitAsync();
            return await _db.Table<PoiEntity>().ToListAsync();
        }

        public async Task<PoiEntity?> GetPoiAsync(string poiId)
        {
            await EnsureInitAsync();
            return await _db.FindAsync<PoiEntity>(poiId);
        }

        public async Task<int> SavePoiAsync(PoiEntity poi)
        {
            await EnsureInitAsync();
            poi.LanguageCode = LanguageHelper.NormalizeToSupported(poi.LanguageCode);
            return await _db.InsertOrReplaceAsync(poi);
        }

        public async Task<int> DeletePoiAsync(PoiEntity poi)
        {
            await EnsureInitAsync();
            return await _db.DeleteAsync(poi);
        }

        public async Task<int> DeleteAllPoisAsync()
        {
            await EnsureInitAsync();
            return await _db.DeleteAllAsync<PoiEntity>();
        }

        // ── Tours ──────────────────────────────────────────────────

        public async Task<List<TourEntity>> GetToursAsync(string languageCode)
        {
            await EnsureInitAsync();
            return await _db.Table<TourEntity>()
                            .Where(t => t.LanguageCode == languageCode)
                            .ToListAsync();
        }

        public async Task<List<TourEntity>> GetAllToursAsync()
        {
            await EnsureInitAsync();
            return await _db.Table<TourEntity>().ToListAsync();
        }

        public async Task<TourEntity?> GetTourAsync(string tourId)
        {
            await EnsureInitAsync();
            return await _db.FindAsync<TourEntity>(tourId);
        }

        public async Task SaveTourAsync(TourEntity tour)
        {
            await EnsureInitAsync();
            await _db.InsertOrReplaceAsync(tour);
        }

        public async Task<int> DeleteTourAsync(string tourId)
        {
            await EnsureInitAsync();
            return await _db.Table<TourEntity>().Where(t => t.TourId == tourId).DeleteAsync();
        }

        public async Task DeleteAllToursAsync()
        {
            await EnsureInitAsync();
            await _db.DeleteAllAsync<TourEntity>();
        }

        // ── Articles ──────────────────────────────────────────────

        public async Task<List<ArticleEntity>> GetArticlesByTypeAsync(string type, string lang, int limit = 10)
        {
            await EnsureInitAsync();
            return await _db.Table<ArticleEntity>()
                            .Where(a => a.Type == type && a.Lang == lang)
                            .OrderByDescending(a => a.PublishedAt)
                            .Take(limit)
                            .ToListAsync();
        }

        public async Task<ArticleEntity?> GetArticleAsync(string articleId)
        {
            await EnsureInitAsync();
            return await _db.FindAsync<ArticleEntity>(articleId);
        }

        public async Task ClearArticlesByTypeAsync(string type, string lang)
        {
            await EnsureInitAsync();
            await _db.ExecuteAsync("DELETE FROM Articles WHERE Type = ? AND Lang = ?", type, lang);
        }

        public async Task UpsertArticleAsync(ArticleEntity entity)
        {
            await EnsureInitAsync();
            await _db.InsertOrReplaceAsync(entity);
        }

        // ── Listen History ─────────────────────────────────────────

        /// <summary>
        /// Upsert: mỗi POI chỉ giữ 1 row; cập nhật LastListenedAt và TotalListenDuration.
        /// </summary>
        public async Task UpsertListenHistoryAsync(ListenHistoryEntity item)
        {
            await EnsureInitAsync();
            await _db.InsertOrReplaceAsync(item);
        }

        /// <summary>Lấy top <paramref name="limit"/> POI nghe gần nhất (offline cache).</summary>
        public async Task<List<ListenHistoryEntity>> GetRecentListenHistoryAsync(int limit = 5)
        {
            await EnsureInitAsync();
            return await _db.Table<ListenHistoryEntity>()
                            .OrderByDescending(h => h.LastListenedAtTicks)
                            .Take(limit)
                            .ToListAsync();
        }

        /// <summary>
        /// Lấy top <paramref name="limit"/> mục lịch sử đã join với PoiEntity (title, logo).
        /// Một raw query duy nhất — không N+1.
        /// </summary>
        public async Task<List<AudioGo.Mobile.Models.HistoryPoiViewModel>> GetRecentHistoryWithPoiAsync(int limit = 5)
        {
            await EnsureInitAsync();

            // SQLite-net không hỗ trợ JOIN qua LINQ → dùng raw SQL
            var sql = @"
                SELECT h.poi_id                   AS PoiId,
                       p.Title                   AS Title,
                       p.LocalLogoPath           AS LocalLogoPath,
                       p.LogoUrl                 AS LogoUrl,
                       h.last_listened_at_ticks  AS LastListenedAtTicks,
                       h.total_listen_duration   AS TotalListenDuration,
                       h.is_completed            AS IsCompleted
                FROM   ListenHistory h
                INNER JOIN Pois p ON p.PoiId = h.poi_id
                ORDER BY h.last_listened_at_ticks DESC
                LIMIT ?";

            // INNER JOIN: chỉ hiện POI có trong bảng Pois (đã tải meta)
            var rows = await _db.QueryAsync<HistoryJoinRow>(sql, limit);
            return rows.Select(r => new AudioGo.Mobile.Models.HistoryPoiViewModel
            {
                PoiId               = r.PoiId,
                Title               = r.Title ?? string.Empty,
                LocalLogoPath       = r.LocalLogoPath,
                LogoUrl             = r.LogoUrl,
                LastListenedAt      = new DateTime(r.LastListenedAtTicks, DateTimeKind.Utc),
                TotalListenDuration = r.TotalListenDuration,
                IsCompleted         = r.IsCompleted
            }).ToList();
        }

        /// <summary>Xóa toàn bộ lịch sử (dùng khi reset thiết bị / logout).</summary>
        public async Task DeleteAllListenHistoryAsync()
        {
            await EnsureInitAsync();
            await _db.DeleteAllAsync<ListenHistoryEntity>();
        }

        // ── Helper for raw JOIN query ────────────────────────────────
        private sealed class HistoryJoinRow
        {
            public string  PoiId               { get; set; } = string.Empty;
            public string? Title               { get; set; }
            public string? LocalLogoPath       { get; set; }
            public string? LogoUrl             { get; set; }
            public long    LastListenedAtTicks  { get; set; }
            public int     TotalListenDuration  { get; set; }
            public bool    IsCompleted          { get; set; }
        }

        private sealed class TableInfoRow
        {
            public int    cid         { get; set; }
            public string name        { get; set; } = string.Empty;
            public string type        { get; set; } = string.Empty;
            public int    notnull     { get; set; }
            public string dflt_value  { get; set; } = string.Empty;
            public int    pk          { get; set; }
        }

        private sealed class PragmaRow
        {
            public int user_version { get; set; }
        }
    }
}
