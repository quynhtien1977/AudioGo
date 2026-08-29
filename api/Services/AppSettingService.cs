using Microsoft.Extensions.Caching.Memory;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Services.Interfaces;
using Shared.DTOs;

namespace Server.Services;

/// <summary>
/// Đọc/ghi AppSetting với 3-tier fallback:
///   1. In-memory cache (TTL 60s)
///   2. DB bảng AppSetting
///   3. IConfiguration (appsettings.json / env var)
/// </summary>
public class AppSettingService : IAppSettingService
{
    private readonly AppDbContext  _db;
    private readonly IMemoryCache  _cache;
    private readonly IConfiguration _config;

    private static readonly TimeSpan CacheTtl = TimeSpan.FromSeconds(60);
    private const string CacheKeyPrefix = "appsetting:";

    public AppSettingService(AppDbContext db, IMemoryCache cache, IConfiguration config)
    {
        _db     = db;
        _cache  = cache;
        _config = config;
    }

    public async Task<T> GetAsync<T>(string key, T defaultValue)
    {
        var cacheKey = CacheKeyPrefix + key;

        if (_cache.TryGetValue(cacheKey, out T? cached) && cached is not null)
            return cached;

        // 2. Query DB
        var setting = await _db.AppSettings
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.SettingKey == key);

        string? rawValue = setting?.SettingValue;

        // 3. Fallback: IConfiguration (appsettings.json / env var)
        if (rawValue is null)
        {
            // Convention: "TouristAccess.PriceVnd" → "TouristAccess:PriceVnd"
            var configKey = key.Replace('.', ':');
            rawValue = _config[configKey];
        }

        T result = rawValue is not null ? Parse<T>(rawValue, defaultValue) : defaultValue;

        _cache.Set(cacheKey, result, CacheTtl);
        return result;
    }

    public async Task UpsertAsync(string key, string value, string? updatedByAccountId)
    {
        var existing = await _db.AppSettings.FindAsync(key);
        if (existing is null)
        {
            _db.AppSettings.Add(new AppSetting
            {
                SettingKey          = key,
                SettingValue        = value,
                UpdatedAt           = DateTime.UtcNow,
                UpdatedByAccountId  = updatedByAccountId
            });
        }
        else
        {
            existing.SettingValue       = value;
            existing.UpdatedAt          = DateTime.UtcNow;
            existing.UpdatedByAccountId = updatedByAccountId;
        }

        await _db.SaveChangesAsync();

        // Invalidate cache ngay lập tức
        _cache.Remove(CacheKeyPrefix + key);
    }

    public async Task<List<AppSettingDto>> GetAllAsync()
    {
        return await _db.AppSettings
            .AsNoTracking()
            .OrderBy(s => s.SettingKey)
            .Select(s => new AppSettingDto(
                s.SettingKey,
                s.SettingValue,
                s.DataType,
                s.Description,
                s.UpdatedAt,
                s.UpdatedByAccountId))
            .ToListAsync();
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private static T Parse<T>(string raw, T fallback)
    {
        try
        {
            var type = typeof(T);
            if (type == typeof(string))  return (T)(object)raw;
            if (type == typeof(int))     return (T)(object)int.Parse(raw);
            if (type == typeof(decimal)) return (T)(object)decimal.Parse(raw);
            if (type == typeof(bool))    return (T)(object)bool.Parse(raw);
            if (type == typeof(double))  return (T)(object)double.Parse(raw);
        }
        catch { /* parse error → trả fallback */ }
        return fallback;
    }
}
