using AudioGo.Models;
using SQLite;

namespace AudioGo.Data
{
    public class AppDatabase
    {
        private readonly SQLiteAsyncConnection _db;

        public AppDatabase(string dbPath)
        {
            _db = new SQLiteAsyncConnection(dbPath,
                SQLiteOpenFlags.ReadWrite | SQLiteOpenFlags.Create | SQLiteOpenFlags.SharedCache);
        }

        public async Task InitAsync()
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

        public Task<List<PoiEntity>> GetAllPoisAsync() => _db.Table<PoiEntity>().ToListAsync();

        public async Task<PoiEntity?> GetPoiAsync(string poiId) => await _db.FindAsync<PoiEntity>(poiId);

        public Task<int> SavePoiAsync(PoiEntity poi)
            => _db.InsertOrReplaceAsync(poi);

        public Task<int> DeletePoiAsync(PoiEntity poi) => _db.DeleteAsync(poi);
    }
}
