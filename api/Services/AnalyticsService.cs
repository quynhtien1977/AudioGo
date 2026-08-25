using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Repositories.Interfaces;
using Server.Services.Interfaces;
using Shared.DTOs;

namespace Server.Services
{
    /// <summary>
    /// Triển khai analytics queries đã được tách ra khỏi AnalyticsController.
    /// </summary>
    public class AnalyticsService : IAnalyticsService
    {
        private readonly AppDbContext              _db;
        private readonly IListenHistoryRepository  _history;
        private readonly ILocationLogRepository    _location;

        public AnalyticsService(
            AppDbContext db,
            IListenHistoryRepository history,
            ILocationLogRepository location)
        {
            _db       = db;
            _history  = history;
            _location = location;
        }

        // ─────────────────────────────────────────────────────────────────────
        // Top POIs
        // ─────────────────────────────────────────────────────────────────────
        public async Task<List<TopPoiDto>> GetTopPoisAsync(string? accountId, bool isOwner, int top = 10)
        {
            // Owner: chỉ thấy POI thuộc account của mình
            List<(string PoiId, int Count)> topPois;
            if (isOwner && !string.IsNullOrWhiteSpace(accountId))
            {
                var raw = await (
                    from h in _db.ListenHistories.AsNoTracking()
                    join p in _db.Pois.AsNoTracking() on h.PoiId equals p.PoiId
                    where p.AccountId == accountId
                    group h by h.PoiId into g
                    orderby g.Count() descending
                    select new { PoiId = g.Key, Count = g.Count() }
                ).Take(top).ToListAsync();

                topPois = raw.Select(x => (x.PoiId, x.Count)).ToList();
            }
            else
            {
                var historyTopPois = await _history.GetTopPoisAsync(top);
                topPois = historyTopPois.Select(tp => (tp.PoiId, tp.Count)).ToList();
            }

            var poiIds = topPois.Select(tp => tp.PoiId).ToList();

            // Lấy title — 1 query duy nhất, tránh N+1
            var titles = await _db.PoiContents.AsNoTracking()
                .Where(c => poiIds.Contains(c.PoiId) && (c.IsMaster || c.LanguageCode == "vi"))
                .GroupBy(c => c.PoiId)
                .Select(g => new { PoiId = g.Key, Title = g.First().Title })
                .ToDictionaryAsync(x => x.PoiId, x => x.Title);

            // Lấy category — 1 query duy nhất
            var categoryMap = await (
                from cp in _db.CategoryPois
                join c in _db.Categories on cp.CategoryId equals c.CategoryId
                where poiIds.Contains(cp.PoiId)
                select new { cp.PoiId, Category = c.Name }
            )
            .GroupBy(x => x.PoiId)
            .ToDictionaryAsync(g => g.Key, g => g.First().Category);

            return topPois.Select(tp => new TopPoiDto(
                tp.PoiId,
                titles.GetValueOrDefault(tp.PoiId, tp.PoiId),
                tp.Count,
                categoryMap.GetValueOrDefault(tp.PoiId, "Unknown")
            )).ToList();
        }

        // ─────────────────────────────────────────────────────────────────────
        // Listen Stats
        // ─────────────────────────────────────────────────────────────────────
        public async Task<DashboardStatsDto> GetListenStatsAsync(string? accountId, bool isOwner, int? days)
        {
            var since = days.HasValue
                ? DateTime.UtcNow.Date.AddDays(-(days.Value - 1))
                : (DateTime?)null;

            int totalListens;
            List<DailyListenDto> dailyListens;

            if (isOwner && !string.IsNullOrWhiteSpace(accountId))
            {
                var ownerBaseQuery =
                    from h in _db.ListenHistories.AsNoTracking()
                    join p in _db.Pois.AsNoTracking() on h.PoiId equals p.PoiId
                    where p.AccountId == accountId
                    select h;

                totalListens = await ownerBaseQuery.CountAsync();

                if (since.HasValue)
                    ownerBaseQuery = ownerBaseQuery.Where(h => h.Timestamp >= since.Value);

                dailyListens = await ownerBaseQuery
                    .GroupBy(h => h.Timestamp.Date)
                    .Select(g => new DailyListenDto
                    {
                        Date          = g.Key,
                        Count         = g.Count(),
                        TotalDuration = g.Sum(x => x.ListenDuration)
                    })
                    .OrderBy(x => x.Date)
                    .ToListAsync();
            }
            else
            {
                totalListens = await _history.GetTotalListensAsync();
                dailyListens = await _history.GetDailyListensAsync(days);
            }

            return new DashboardStatsDto
            {
                TotalListens = totalListens,
                DailyListens = dailyListens
            };
        }

        // ─────────────────────────────────────────────────────────────────────
        // Device Activity Timeline
        // ─────────────────────────────────────────────────────────────────────
        public async Task<DeviceActivityDto> GetDeviceActivityAsync(string deviceId, int days = 7)
        {
            var since = DateTime.UtcNow.AddDays(-days);

            // 1. Location logs của thiết bị
            var locations = await _db.LocationLogs.AsNoTracking()
                .Where(l => l.DeviceId == deviceId && l.Timestamp >= since)
                .OrderBy(l => l.Timestamp)
                .Select(l => new DeviceActivityEventDto(
                    "location", l.Timestamp, l.Latitude, l.Longitude,
                    null, null, null))
                .ToListAsync();

            // 2. Listen history của thiết bị
            var listens = await _db.ListenHistories.AsNoTracking()
                .Where(h => h.DeviceId == deviceId && h.Timestamp >= since)
                .OrderBy(h => h.Timestamp)
                .Select(h => new { h.PoiId, h.Timestamp, h.ListenDuration })
                .ToListAsync();

            // Lấy tên POI — 1 query, tránh N+1
            var poiIds    = listens.Select(h => h.PoiId).Distinct().ToList();
            var poiTitles = await _db.PoiContents.AsNoTracking()
                .Where(c => poiIds.Contains(c.PoiId) && (c.IsMaster || c.LanguageCode == "vi"))
                .GroupBy(c => c.PoiId)
                .Select(g => new { PoiId = g.Key, Title = g.First().Title })
                .ToDictionaryAsync(x => x.PoiId, x => x.Title);

            var listenEvents = listens.Select(h => new DeviceActivityEventDto(
                "listen", h.Timestamp, null, null,
                h.PoiId,
                poiTitles.GetValueOrDefault(h.PoiId, h.PoiId),
                h.ListenDuration
            )).ToList();

            // 3. Merge + sort theo thời gian
            var timeline       = locations.Concat(listenEvents).OrderBy(e => e.Timestamp).ToList();
            var allTimestamps  = timeline.Select(e => e.Timestamp).ToList();

            return new DeviceActivityDto(
                deviceId,
                allTimestamps.Count > 0 ? allTimestamps.Min() : null,
                allTimestamps.Count > 0 ? allTimestamps.Max() : null,
                locations.Count,
                listens.Count,
                timeline
            );
        }
    }
}
