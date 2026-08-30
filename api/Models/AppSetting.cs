namespace Server.Models;

/// <summary>
/// Key-value store cho cấu hình động của ứng dụng — Admin chỉnh qua CMS UI, không cần restart server.
///
/// Các key đang dùng:
///   "TouristAccess.PriceVnd"              — Giá vào app qua SePay QR (decimal, VND)
///   "TouristAccess.DurationDays"          — Số ngày hiệu lực sau thanh toán SePay (int)
///   "AppAccessCode.DefaultDurationDays"   — Số ngày mặc định khi quét QR access code (int)
/// </summary>
public class AppSetting
{
    /// <summary>PK — cũng là key tra cứu. Convention: "Domain.FieldName".</summary>
    public string SettingKey { get; set; } = null!;

    /// <summary>Giá trị lưu dạng string — parse về đúng type khi dùng.</summary>
    public string SettingValue { get; set; } = null!;

    /// <summary>Kiểu dữ liệu gợi ý cho UI validation: "decimal" | "int" | "bool" | "string".</summary>
    public string DataType { get; set; } = "string";

    /// <summary>Label mô tả hiển thị trong CMS AppSettings page.</summary>
    public string? Description { get; set; }

    public DateTime? UpdatedAt          { get; set; }
    public string?   UpdatedByAccountId { get; set; }
}
