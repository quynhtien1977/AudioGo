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
            }
            catch (SQLiteException)
            {
                // Schema thay đổi không tương thích — drop và tạo lại
                await _db.DropTableAsync<PoiEntity>();
                await _db.CreateTableAsync<PoiEntity>();
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
