using SQLite;
using Shared;

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
            await _db.CreateTableAsync<POI>();
        }

        public Task<List<POI>> GetAllPoisAsync() => _db.Table<POI>().ToListAsync();

        public Task<POI?> GetPoiAsync(int id) => _db.FindAsync<POI>(id);

        public Task<int> SavePoiAsync(POI poi)
            => poi.Id == 0 ? _db.InsertAsync(poi) : _db.UpdateAsync(poi);

        public Task<int> DeletePoiAsync(POI poi) => _db.DeleteAsync(poi);
    }
}
