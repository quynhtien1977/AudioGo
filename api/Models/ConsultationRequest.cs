namespace Server.Models;

/// <summary>
/// Lưu yêu cầu tư vấn từ chủ quán tiềm năng gửi qua landing page.
/// Admin xem và liên hệ lại để tạo tài khoản Owner cho họ.
/// </summary>
public class ConsultationRequest
{
    public string  RequestId      { get; set; } = Guid.NewGuid().ToString();
    public string  FullName       { get; set; } = null!;
    public string  RestaurantName { get; set; } = null!;
    public string  PhoneNumber    { get; set; } = null!;
    public string  Area           { get; set; } = "Vĩnh Khánh Q4"; // mặc định
    public string? Email          { get; set; }
    public string? Message        { get; set; }

    /// <summary>"New" | "Contacted" | "Done"</summary>
    public string   Status      { get; set; } = "New";
    public DateTime CreatedAt   { get; set; } = DateTime.UtcNow;
    public DateTime? ContactedAt { get; set; }
}
