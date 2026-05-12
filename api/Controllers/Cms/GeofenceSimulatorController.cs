using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using System.Security.Claims;

namespace Server.Controllers.Cms
{
    /// <summary>
    /// Debug endpoint — Admin chỉ dùng để simulate/demo cơ chế tranh chấp POI Geofence.
    /// KHÔNG ảnh hưởng dữ liệu production. Chỉ đọc DB và tính toán thuần.
    /// </summary>
    [ApiController]
    [Route("api/cms/debug")]
    [Authorize(Roles = "Admin")]
    public class GeofenceSimulatorController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly ILogger<GeofenceSimulatorController> _logger;

        public GeofenceSimulatorController(AppDbContext db, ILogger<GeofenceSimulatorController> logger)
        {
            _db     = db;
            _logger = logger;
        }

        // ────────────────────────────────────────────────────────────────────────
        // POST /api/cms/debug/geofence-simulate
        // Body: { "latitude": 10.7769, "longitude": 106.7009,
        //         "customPois": [...],        // optional — simulator mode
        //         "cooldownOverrides": {} }   // optional
        // ────────────────────────────────────────────────────────────────────────

        [HttpPost("geofence-simulate")]
        public async Task<IActionResult> Simulate([FromBody] SimulateRequest req)
        {
            if (req is null)
                return BadRequest(new { message = "Request body is required" });

            _logger.LogInformation(
                "[GeofenceSimulator] Admin={Admin} simulating at ({Lat},{Lon})",
                User.FindFirst(ClaimTypes.NameIdentifier)?.Value, req.Latitude, req.Longitude);

            var sortingTrace    = new List<string>();
            var candidatePois   = new List<CandidatePoiDto>();
            var cooldownOverrides = req.CooldownOverrides ?? new Dictionary<string, bool>();

            // ── Load POI: CustomPois (Simulator) hoặc DB ────────────────────────
            // Khi CustomPois được gửi lên: dùng thẳng — CHỨNG MINH logic C# chạy đúng
            // trên fake data do frontend sinh ra (không persist DB, không side-effect).
            List<SimPoiInput> sourcePois;
            bool usingCustom = req.CustomPois is { Count: > 0 };

            if (usingCustom)
            {
                sourcePois = req.CustomPois!;
                sortingTrace.Add($"⚡ Simulator mode: {sourcePois.Count} fake POI (không query DB)");
            }
            else
            {
                var dbPois = await _db.Pois
                    .Where(p => p.IsActive)
                    .Include(p => p.Contents)
                    .ToListAsync();
                sourcePois = dbPois.Select(p => new SimPoiInput
                {
                    PoiId            = p.PoiId,
                    Name             = GetPoiTitle(p),
                    Latitude         = p.Latitude,
                    Longitude        = p.Longitude,
                    ActivationRadius = p.ActivationRadius,
                    Priority         = p.Priority,
                    HasLocalAudio    = false,   // server không biết local cache device
                }).ToList();
                sortingTrace.Add($"🗄 DB mode: {sourcePois.Count} POI active");
            }

            // ── Bước 1: Lọc theo radius ─────────────────────────────────────────
            var inRadius      = new List<(SimPoiInput Poi, double Distance)>();
            var outsideRadius = new List<string>();

            foreach (var poi in sourcePois)
            {
                var dist = HaversineMeters(req.Latitude, req.Longitude, poi.Latitude, poi.Longitude);
                if (dist <= poi.ActivationRadius)
                    inRadius.Add((poi, dist));
                else
                    outsideRadius.Add($"{poi.Name}(dist={dist:F0}m>r={poi.ActivationRadius}m)");
            }

            sortingTrace.Add(
                $"Bước 1 — Lọc radius: InRadius=[{string.Join(", ", inRadius.Select(x => $"{x.Poi.Name}✅"))}]" +
                (outsideRadius.Any() ? $" | Ngoài=[{string.Join(", ", outsideRadius)}]" : ""));

            if (!inRadius.Any())
            {
                sortingTrace.Add("Kết quả: Không có POI nào trong bán kính → Không phát âm thanh.");
                return Ok(new SimulateResponse
                {
                    SimulationInput = new SimulationInput { Lat = req.Latitude, Lon = req.Longitude, Timestamp = DateTime.UtcNow },
                    CandidatePois   = candidatePois,
                    Winner          = null,
                    SortingTrace    = sortingTrace
                });
            }

            // ── Bước 2: Lọc cooldown ────────────────────────────────────────────
            var eligible  = new List<(SimPoiInput Poi, double Distance)>();
            var cooledOut = new List<string>();

            foreach (var (poi, dist) in inRadius)
            {
                var inCd = cooldownOverrides.TryGetValue(poi.PoiId, out var f) && f;
                if (inCd) cooledOut.Add(poi.Name);
                else eligible.Add((poi, dist));
            }

            sortingTrace.Add(
                $"Bước 2 — Lọc cooldown: Eligible=[{string.Join(", ", eligible.Select(x => x.Poi.Name))}]" +
                (cooledOut.Any() ? $" | Cooldown=[{string.Join(", ", cooledOut)}]" : ""));

            // Build candidate list (mọi POI trong radius kể cả cooled-out để UI hiển thị)
            foreach (var (poi, dist) in inRadius)
            {
                var inCd = cooldownOverrides.TryGetValue(poi.PoiId, out var f2) && f2;
                candidatePois.Add(new CandidatePoiDto
                {
                    PoiId            = poi.PoiId,
                    Name             = poi.Name,
                    Priority         = poi.Priority,
                    DistanceMeters   = Math.Round(dist, 1),
                    ActivationRadius = poi.ActivationRadius,
                    IsInside         = true,
                    HasLocalAudio    = poi.HasLocalAudio,
                    InCooldown       = inCd,
                    Score            = new ScoreDto { Tier1 = poi.Priority, Tier2 = poi.HasLocalAudio ? 1 : 0, Tier3 = dist },
                    Rank             = 0
                });
            }

            if (!eligible.Any())
            {
                sortingTrace.Add("Kết quả: Tất cả POI trong radius đang cooldown → Không phát âm thanh.");
                return Ok(new SimulateResponse
                {
                    SimulationInput = new SimulationInput { Lat = req.Latitude, Lon = req.Longitude, Timestamp = DateTime.UtcNow },
                    CandidatePois   = candidatePois,
                    Winner          = null,
                    SortingTrace    = sortingTrace
                });
            }

            // ── Bước 3: Sort 3-Tier — CÙNG LOGIC với GeofenceService thực tế ────
            // Tier 1: Priority DESC
            // Tier 2: HasLocalAudio DESC   ← bây giờ được truyền đúng từ frontend
            // Tier 3: Distance ASC
            var sorted = eligible
                .OrderByDescending(x => x.Poi.Priority)
                .ThenByDescending(x => x.Poi.HasLocalAudio ? 1 : 0)
                .ThenBy(x => x.Distance)
                .ToList();

            var priorityGroups = eligible.GroupBy(x => x.Poi.Priority).OrderByDescending(g => g.Key).ToList();
            sortingTrace.Add(
                $"Bước 3a — Tier 1 (Priority): {string.Join(", ", priorityGroups.Select(g => $"P={g.Key}:[{string.Join(",", g.Select(x => x.Poi.Name))}]"))}");

            // So sánh winner vs runner-up để xác định tier THỰC SỰ quyết định
            var w  = sorted[0];
            var w2 = sorted.Count > 1 ? (SimPoiInput?)sorted[1].Poi : null;
            var w2dist = sorted.Count > 1 ? (double?)sorted[1].Distance : null;

            string decisionTier, decisionReason;

            if (w2 is null)
            {
                decisionTier   = "Trivial_OnlyOne";
                decisionReason = $"Duy nhất trong vùng phủ — {w.Poi.Name} không tranh chấp";
                sortingTrace.Add($"Bước 3b — Chỉ 1 ứng viên → {decisionReason}");
            }
            else if (w.Poi.Priority != w2.Priority)
            {
                decisionTier   = "Tier1_Priority";
                decisionReason = $"Priority cao hơn: {w.Poi.Name}(P={w.Poi.Priority}) > {w2.Name}(P={w2.Priority})";
                sortingTrace.Add($"Bước 3b — Tier 1 (Priority) quyết định → {decisionReason}");
            }
            else if (w.Poi.HasLocalAudio != w2.HasLocalAudio)
            {
                decisionTier   = "Tier2_HasLocalAudio";
                decisionReason = $"Cùng Priority P={w.Poi.Priority} → Tier 2: {w.Poi.Name} có audio offline, {w2.Name} không";
                sortingTrace.Add($"Bước 3b — Tier 2 (HasLocalAudio) quyết định → {decisionReason}");
            }
            else
            {
                decisionTier   = "Tier3_Distance";
                decisionReason = $"Cùng Priority P={w.Poi.Priority} + cùng audio={w.Poi.HasLocalAudio} → Tier 3: {w.Poi.Name}({w.Distance:F1}m) gần hơn {w2.Name}({w2dist:F1}m)";
                sortingTrace.Add($"Bước 3b — Tier 3 (Distance) quyết định → {decisionReason}");
            }

            // Assign rank
            for (int i = 0; i < sorted.Count; i++)
            {
                var match = candidatePois.FirstOrDefault(c => c.PoiId == sorted[i].Poi.PoiId);
                if (match != null) match.Rank = i + 1;
            }
            foreach (var c in candidatePois.Where(c => c.InCooldown)) c.Rank = 999;

            sortingTrace.Add($"Kết quả: 🏆 WINNER = {w.Poi.Name} (P={w.Poi.Priority}, audio={w.Poi.HasLocalAudio}, D={w.Distance:F1}m) | DecisionTier={decisionTier}");
            for (int i = 1; i < sorted.Count; i++)
                sortingTrace.Add($"  ❌ LOSER #{i}: {sorted[i].Poi.Name} (P={sorted[i].Poi.Priority}, audio={sorted[i].Poi.HasLocalAudio}, D={sorted[i].Distance:F1}m)");

            return Ok(new SimulateResponse
            {
                SimulationInput = new SimulationInput { Lat = req.Latitude, Lon = req.Longitude, Timestamp = DateTime.UtcNow },
                CandidatePois   = candidatePois.OrderBy(c => c.Rank).ToList(),
                Winner          = new WinnerDto
                {
                    PoiId        = w.Poi.PoiId,
                    Name         = w.Poi.Name,
                    DecisionTier = decisionTier,
                    Reason       = decisionReason
                },
                SortingTrace = sortingTrace
            });
        }

        // ── Helpers ──────────────────────────────────────────────────────────────

        private static string GetPoiTitle(Server.Models.Poi poi)
            => poi.Contents.FirstOrDefault(c => c.LanguageCode == "vi")?.Title
               ?? poi.Contents.FirstOrDefault()?.Title
               ?? poi.PoiId;

        private static double HaversineMeters(double lat1, double lon1, double lat2, double lon2)
        {
            const double R = 6371000;
            var dLat = (lat2 - lat1) * Math.PI / 180;
            var dLon = (lon2 - lon1) * Math.PI / 180;
            var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2)
                  + Math.Cos(lat1 * Math.PI / 180) * Math.Cos(lat2 * Math.PI / 180)
                  * Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
            return R * 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        }
    }

    // ── DTOs ──────────────────────────────────────────────────────────────────────

    public class SimulateRequest
    {
        public double Latitude  { get; set; }
        public double Longitude { get; set; }
        /// <summary>Key = PoiId, Value = true nghĩa là giả lập POI đó đang trong cooldown</summary>
        public Dictionary<string, bool>? CooldownOverrides { get; set; }
        /// <summary>
        /// Nếu có: dùng danh sách này thay vì query DB (Simulator mode với fake POI).
        /// Mỗi POI bao gồm HasLocalAudio thực sự để test Tier 2.
        /// </summary>
        public List<SimPoiInput>? CustomPois { get; set; }
    }

    /// <summary>Fake POI do frontend sinh ra để test — không lưu DB</summary>
    public class SimPoiInput
    {
        public string PoiId           { get; set; } = string.Empty;
        public string Name            { get; set; } = string.Empty;
        public double Latitude        { get; set; }
        public double Longitude       { get; set; }
        public double ActivationRadius { get; set; }  // double to accept JS floats
        public int    Priority        { get; set; }
        public bool   HasLocalAudio   { get; set; }
    }

    public class SimulateResponse
    {
        public SimulationInput      SimulationInput { get; set; } = new();
        public List<CandidatePoiDto> CandidatePois  { get; set; } = [];
        public WinnerDto?           Winner          { get; set; }
        public List<string>         SortingTrace    { get; set; } = [];
    }

    public class SimulationInput
    {
        public double   Lat       { get; set; }
        public double   Lon       { get; set; }
        public DateTime Timestamp { get; set; }
    }

    public class CandidatePoiDto
    {
        public string  PoiId            { get; set; } = string.Empty;
        public string  Name             { get; set; } = string.Empty;
        public int     Priority         { get; set; }
        public double  DistanceMeters   { get; set; }
        public double  ActivationRadius { get; set; }
        public bool    IsInside         { get; set; }
        public bool    HasLocalAudio    { get; set; }
        public bool    InCooldown       { get; set; }
        public ScoreDto Score           { get; set; } = new();
        public int     Rank             { get; set; }
    }

    public class ScoreDto
    {
        public int    Tier1 { get; set; }   // Priority
        public int    Tier2 { get; set; }   // HasLocalAudio (0 or 1)
        public double Tier3 { get; set; }   // Distance
    }

    public class WinnerDto
    {
        public string PoiId        { get; set; } = string.Empty;
        public string Name         { get; set; } = string.Empty;
        public string DecisionTier { get; set; } = string.Empty;
        public string Reason       { get; set; } = string.Empty;
    }
}
