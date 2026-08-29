namespace Server.Models;

/// <summary>
/// Banner / Event quảng cáo — Admin hoặc Editor tạo, hiển thị trên Landing Page và/hoặc Mobile App.
/// </summary>
public class Banner
{
    public string BannerId { get; set; } = Guid.NewGuid().ToString();

    /// <summary>Tiêu đề ngắn gọn — hiển thị overlay trên ảnh hoặc bên cạnh ảnh.</summary>
    public string Title { get; set; } = null!;

    /// <summary>Mô tả / sub-title ngắn (optional).</summary>
    public string? Subtitle { get; set; }

    /// <summary>URL ảnh banner lưu trên Azure Blob Storage.</summary>
    public string ImageUrl { get; set; } = null!;

    /// <summary>URL khi user click vào banner (external link, deep link, hoặc null nếu không cần).</summary>
    public string? LinkUrl { get; set; }

    /// <summary>
    /// Nơi hiển thị banner:
    /// - "MobileHome" : Chỉ trên màn hình Home của app mobile
    /// - "Landing"    : Chỉ trên landing page web
    /// - "Both"       : Cả hai
    /// </summary>
    public string DisplayTarget { get; set; } = "Both";

    /// <summary>Ngày bắt đầu hiển thị. NULL = hiển thị ngay khi IsActive = true.</summary>
    public DateTime? StartDate { get; set; }

    /// <summary>Ngày kết thúc hiển thị. NULL = không hết hạn.</summary>
    public DateTime? EndDate { get; set; }

    /// <summary>Admin/Editor có thể tắt banner này mà không cần xóa.</summary>
    public bool IsActive { get; set; } = true;

    /// <summary>Thứ tự sắp xếp — số nhỏ hơn hiển thị trước.</summary>
    public int SortOrder { get; set; } = 0;

    public string? CreatedByAccountId { get; set; }
    public DateTime  CreatedAt         { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt         { get; set; }
}
