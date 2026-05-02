namespace AudioGo_Mobile.Helpers;

/// <summary>
/// Static context bag truyền dữ liệu một chiều TourDetail → MapPage.
/// </summary>
public static class TourMapContext
{
    /// <summary>
    /// Danh sách PoiId cần hiển thị trên MapPage khi navigate từ TourDetailPage.
    /// null = chế độ bình thường (hiển thị tất cả POI).
    /// </summary>
    public static List<string>? PendingTourPoiIds { get; set; }

    /// <summary>
    /// Thứ tự số của từng POI trong tour (PoiId → StepOrder).
    /// Dùng để hiển thị badge số thứ tự trên pin khi MapPage mở ở chế độ tour.
    /// </summary>
    public static Dictionary<string, int>? PendingTourStepOrders { get; set; }

    /// <summary>
    /// Reset toàn bộ context sau khi MapPage đã đọc.
    /// </summary>
    public static void Clear()
    {
        PendingTourPoiIds    = null;
        PendingTourStepOrders = null;
    }
}
