namespace AudioGo_Mobile.Helpers;

/// <summary>
/// Simple static bag để truyền dữ liệu một chiều giữa các page (TourDetail → Map).
/// Thay thế MessagingCenter vì MAUI 10 đã thay bằng WeakReferenceMessenger nhưng cần thêm package.
/// </summary>
public static class TourMapContext
{
    /// <summary>
    /// Danh sách PoiId cần hiển thị trên MapPage khi navigate từ TourDetailPage.
    /// null = chế độ bình thường (hiển thị tất cả POI).
    /// </summary>
    public static List<string>? PendingTourPoiIds { get; set; }
}
