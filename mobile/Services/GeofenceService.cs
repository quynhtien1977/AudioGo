using AudioGo.Helpers;
using AudioGo.Services.Interfaces;
using Shared;

namespace AudioGo.Services
{
    public class GeofenceService : IGeofenceService
    {
        private readonly TimeSpan _cooldown = TimeSpan.FromMinutes(5);
        private readonly Dictionary<string, DateTime> _lastTriggered = new();
        private List<POI> _pois = new();

        public event EventHandler<POI>? PoiTriggered;

        public Task StartMonitoringAsync(IEnumerable<POI> pois)
        {
            _pois = pois.ToList();
            return Task.CompletedTask;
        }

        public Task StopMonitoringAsync()
        {
            _pois.Clear();
            _lastTriggered.Clear();
            return Task.CompletedTask;
        }

        public void OnLocationUpdated(double latitude, double longitude)
        {
            // Lọc ra tất cả các POI mà user đang đứng bên trong (thoả mãn bán kính và thời gian cooldown)
            var eligiblePois = new List<(POI Poi, double Distance)>();

            foreach (var poi in _pois)
            {
                var dist = GeoHelper.HaversineMeters(latitude, longitude, poi.Latitude, poi.Longitude);
                if (dist > poi.ActivationRadius) continue;
                if (_lastTriggered.TryGetValue(poi.PoiId, out var last) && DateTime.UtcNow - last < _cooldown) continue;

                eligiblePois.Add((poi, dist));
            }

            if (eligiblePois.Any())
            {
                // TODO (Optimization Note - PriorityQueue vs LINQ Sorting): 
                // Hiện tại đang dùng LINQ OrderBy(Priority).ThenBy(Distance) vì số lượng điểm POI "giao nhau" (K) 
                // mà user đồng thời giẫm lên thường rất nhỏ (K <= 5). Chi phí sắp xếp O(K log K) cực kỳ nhanh.
                // Nếu sau này hệ thống mở rộng và user có thể đứng lọt thỏm giữa hàng ngàn vùng POI đan xen,
                // hãy cân nhắc chuyển sang sử dụng cấu trúc PriorityQueue để tối ưu thuật toán lấy điểm duy nhất.
                /* * LÝ DO KHÔNG SỬ DỤNG PriorityQueue CHO LOGIC GEOFENCE NÀY:
                * Mặc dù PriorityQueue (từ .NET 6) là cấu trúc tối ưu nhất về lý thuyết (O(log N)) để lấy phần tử tốt nhất, 
                * giải pháp dùng LINQ được ưu tiên vì các lý do thực tiễn sau:
                *
                * 1. Kích thước tập dữ liệu quá nhỏ (Micro-optimization overkill):
                * - Ứng dụng duyệt qua N điểm POI để tính khoảng cách (O(N)).
                * - Số lượng điểm (K) user thực sự đè lên cùng lúc cực kỳ nhỏ (thường chỉ 1 đến 5 điểm).
                * - Sắp xếp K phần tử bằng LINQ (.OrderBy().ThenBy()) mất O(K log K), chỉ tốn vài nano giây.
                * - Việc này không có khác biệt tốc độ so với PriorityQueue, thậm chí nhanh hơn vì không 
                * tốn chi phí cấp phát bộ nhớ (Allocation tree) cho cấu trúc Queue.
                *
                * 2. Khó khăn khi so sánh nhiều điều kiện (Multi-level sorting):
                * - Yêu cầu có 2 tầng ưu tiên: Level 1 (Priority to hơn) -> Level 2 (Distance gần tâm hơn).
                * - PriorityQueue<TElement, TPriority> chỉ nhận 1 biến TPriority. Để xử lý 2 điều kiện 
                * cùng lúc cần phải khai báo thêm class IComparer ngoài luồng cực kỳ cồng kềnh.
                * - Cú pháp OrderBy(Priority).ThenBy(Distance) của List tự mô tả tốt, dễ đọc và dễ maintain hơn.
                */
                var bestPoiMatch = eligiblePois
                    .OrderByDescending(x => x.Poi.Priority)
                    .ThenBy(x => x.Distance)
                    .First();

                var bestPoi = bestPoiMatch.Poi;

                _lastTriggered[bestPoi.PoiId] = DateTime.UtcNow;
                PoiTriggered?.Invoke(this, bestPoi);
            }
        }
    }
}
