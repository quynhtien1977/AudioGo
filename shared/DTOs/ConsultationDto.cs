namespace Shared.DTOs;

/// <summary>DTO trả về danh sách yêu cầu tư vấn.</summary>
public record ConsultationDto(
    string    RequestId,
    string    FullName,
    string?   RestaurantName,
    string    PhoneNumber,
    string?   Area,
    string?   Email,
    string?   Message,
    string    Status,
    DateTime  CreatedAt,
    DateTime? ContactedAt,
    DateTime? RejectedAt
);

/// <summary>Request cập nhật trạng thái yêu cầu tư vấn. Thay thế record lồng trong controller cũ.</summary>
public record UpdateConsultStatusRequest(string Status);
