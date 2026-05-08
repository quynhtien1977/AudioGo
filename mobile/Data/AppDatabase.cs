using AudioGo.Helpers;
using AudioGo.Models;
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

        private async Task DoInitAsync()
        {
            try
            {
                await _db.CreateTableAsync<PoiEntity>();
                await _db.CreateTableAsync<TourEntity>();
            }
            catch (SQLiteException)
            {
                // Schema thay đổi không tương thích — drop và tạo lại
                await _db.DropTableAsync<PoiEntity>();
                await _db.CreateTableAsync<PoiEntity>();

                await _db.DropTableAsync<TourEntity>();
                await _db.CreateTableAsync<TourEntity>();
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

        private sealed class TableInfoRow
        {
            public int cid { get; set; }
            public string name { get; set; } = string.Empty;
            public string type { get; set; } = string.Empty;
            public int notnull { get; set; }
            public string dflt_value { get; set; } = string.Empty;
            public int pk { get; set; }
        }
    }
}
