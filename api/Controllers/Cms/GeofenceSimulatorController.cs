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
        // Body: { "latitude": 10.7769, "longitude": 106.7009, "cooldownOverrides": {"poi-id-1": true} }
        // ────────────────────────────────────────────────────────────────────────

        [HttpPost("geofence-simulate")]
        public async Task<IActionResult> Simulate([FromBody] SimulateRequest req)
        {
            if (req is null)
                return BadRequest(new { message = "Request body is required" });

            _logger.LogInformation(
                "[GeofenceSimulator] Admin={Admin} simulating at ({Lat},{Lon})",
                User.FindFirst(ClaimTypes.NameIdentifier)?.Value, req.Latitude, req.Longitude);

            // ── Load tất cả POI active từ DB ────────────────────────────────────
            var pois = await _db.Pois
                .Where(p => p.IsActive)
                .Include(p => p.Contents)
                .ToListAsync();

            var sortingTrace = new List<string>();
            var candidatePois = new List<CandidatePoiDto>();
            var cooldownOverrides = req.CooldownOverrides ?? new Dictionary<string, bool>();

            // ── Bước 1: Lọc theo radius ─────────────────────────────────────────
            var inRadius = new List<(Server.Models.Poi Poi, double Distance)>();
            var outsideRadius = new List<string>();

            foreach (var poi in pois)
            {
                var dist = HaversineMeters(req.Latitude, req.Longitude, poi.Latitude, poi.Longitude);
                if (dist <= poi.ActivationRadius)
                    inRadius.Add((poi, dist));
                else
                    outsideRadius.Add($"{GetPoiTitle(poi)}(dist={dist:F0}m>r={poi.ActivationRadius}m)");
            }

            var inRadiusLabel = inRadius.Count > 0
                ? string.Join(", ", inRadius.Select(x => $"{GetPoiTitle(x.Poi)}✅"))
                : "(none)";
            var outsideLabel = outsideRadius.Count > 0
                ? string.Join(", ", outsideRadius.Select(x => $"{x}❌"))
                : "(none)";

            sortingTrace.Add($"Bước 1 — Lọc radius: InRadius=[{inRadiusLabel}] | Ngoài=[{outsideLabel}]");

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
            var eligible = new List<(Server.Models.Poi Poi, double Distance, bool InCooldown)>();
            var cooledOut = new List<string>();

            foreach (var (poi, dist) in inRadius)
            {
                var inCooldown = cooldownOverrides.TryGetValue(poi.PoiId, out var forced) && forced;
                if (inCooldown)
                    cooledOut.Add(GetPoiTitle(poi));
                else
                    eligible.Add((poi, dist, false));
            }

            sortingTrace.Add($"Bước 2 — Lọc cooldown: Eligible=[{string.Join(", ", eligible.Select(x => GetPoiTitle(x.Poi)))}]" +
                             (cooledOut.Any() ? $" | Cooldown=[{string.Join(", ", cooledOut)}]" : ""));

            // Build candidate list (bao gồm cả cooled-out để hiển thị trên UI)
            foreach (var (poi, dist) in inRadius)
            {
                var inCooldown = cooldownOverrides.TryGetValue(poi.PoiId, out var forced) && forced;
                // hasLocalAudio = false trong simulator (server không biết local cache của device)
                // → Frontend có thể override sau nếu cần demo
                candidatePois.Add(new CandidatePoiDto
                {
                    PoiId           = poi.PoiId,
                    Name            = GetPoiTitle(poi),
                    Priority        = poi.Priority,
                    DistanceMeters  = Math.Round(dist, 1),
                    ActivationRadius = poi.ActivationRadius,
                    IsInside        = dist <= poi.ActivationRadius,
                    HasLocalAudio   = false,   // server side không biết device cache
                    InCooldown      = inCooldown,
                    Score           = new ScoreDto { Tier1 = poi.Priority, Tier2 = 0, Tier3 = dist },
                    Rank            = 0        // set sau khi sort
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

            // ── Bước 3: Sort 3 Tier ─────────────────────────────────────────────
            // Tier 1: Priority DESC   (subscription plan — số cao hơn thắng)
            // Tier 2: HasLocalAudio DESC (preload offline — server luôn = false trong sim, client demo có thể set)
            // Tier 3: Distance ASC    (gần tâm hơn thắng)
            var sorted = eligible
                .OrderByDescending(x => x.Poi.Priority)
                .ThenBy(x => x.Distance)      // HasLocalAudio = false cho tất cả trong sim → skip Tier 2
                .ToList();

            // Tier 1 trace
            var priorityGroups = eligible.GroupBy(x => x.Poi.Priority).OrderByDescending(g => g.Key).ToList();
            sortingTrace.Add($"Bước 3a — Tier 1 (Priority): {string.Join(", ", priorityGroups.Select(g => $"P={g.Key}:[{string.Join(",", g.Select(x => GetPoiTitle(x.Poi)))}]"))}");

            // Detect decision tier
            string decisionTier;
            string decisionReason;

            if (priorityGroups.Count > 1 || priorityGroups[0].Count() == 1)
            {
                // Priority rõ ràng phân giải hoặc chỉ có 1 ứng viên
                decisionTier   = priorityGroups[0].Count() == 1 && eligible.Count == 1
                    ? "Trivial_OnlyOne"
                    : "Tier1_Priority";
                decisionReason = $"Priority cao nhất P={sorted[0].Poi.Priority} → {GetPoiTitle(sorted[0].Poi)} thắng rõ ràng";
                sortingTrace.Add($"Bước 3b — Tier 1 đã phân giải → {decisionReason}");
            }
            else
            {
                // Priority tie → kiểm tra Tier 2 HasLocalAudio (trong sim server không biết → ghi note)
                sortingTrace.Add($"Bước 3b — Tier 2 (HasLocalAudio): Trong Simulator server-side, mọi POI đều có HasLocalAudio=false. " +
                                 $"Trên thiết bị thật, POI có audio đã cache sẽ thắng ở bước này.");

                // Tier 3: Distance
                sortingTrace.Add($"Bước 3c — Tier 3 (Distance): {string.Join(", ", sorted.Select(x => $"{GetPoiTitle(x.Poi)}={x.Distance:F1}m"))} → {GetPoiTitle(sorted[0].Poi)} gần nhất");
                decisionTier   = "Tier3_Distance";
                decisionReason = $"Priority tie (P={sorted[0].Poi.Priority}) → Tier2 tie (server không biết local cache) → Distance: {GetPoiTitle(sorted[0].Poi)} gần nhất ({sorted[0].Distance:F1}m)";
            }

            // Assign rank
            for (int i = 0; i < sorted.Count; i++)
            {
                var match = candidatePois.FirstOrDefault(c => c.PoiId == sorted[i].Poi.PoiId);
                if (match != null) match.Rank = i + 1;
            }
            // Cooled-out POI nhận rank 999
            foreach (var c in candidatePois.Where(c => c.InCooldown)) c.Rank = 999;

            var winner = sorted[0];
            sortingTrace.Add($"Kết quả: 🏆 WINNER = {GetPoiTitle(winner.Poi)} (P={winner.Poi.Priority}, D={winner.Distance:F1}m) | DecisionTier={decisionTier}");

            // Losers log
            for (int i = 1; i < sorted.Count; i++)
            {
                sortingTrace.Add($"  ❌ LOSER #{i}: {GetPoiTitle(sorted[i].Poi)} (P={sorted[i].Poi.Priority}, D={sorted[i].Distance:F1}m)");
            }

            return Ok(new SimulateResponse
            {
                SimulationInput = new SimulationInput { Lat = req.Latitude, Lon = req.Longitude, Timestamp = DateTime.UtcNow },
                CandidatePois   = candidatePois.OrderBy(c => c.Rank).ToList(),
                Winner          = new WinnerDto
                {
                    PoiId        = winner.Poi.PoiId,
                    Name         = GetPoiTitle(winner.Poi),
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
    }

    public class SimulateResponse
    {
        public SimulationInput     SimulationInput { get; set; } = new();
        public List<CandidatePoiDto> CandidatePois { get; set; } = [];
        public WinnerDto?          Winner          { get; set; }
        public List<string>        SortingTrace    { get; set; } = [];
    }

    public class SimulationInput
    {
        public double   Lat       { get; set; }
        public double   Lon       { get; set; }
        public DateTime Timestamp { get; set; }
    }

    public class CandidatePoiDto
    {
        public string  PoiId           { get; set; } = string.Empty;
        public string  Name            { get; set; } = string.Empty;
        public int     Priority        { get; set; }
        public double  DistanceMeters  { get; set; }
        public int     ActivationRadius { get; set; }
        public bool    IsInside        { get; set; }
        public bool    HasLocalAudio   { get; set; }
        public bool    InCooldown      { get; set; }
        public ScoreDto Score          { get; set; } = new();
        public int     Rank            { get; set; }
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
