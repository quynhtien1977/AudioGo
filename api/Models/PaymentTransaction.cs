namespace Server.Models
{
    /// <summary>
    /// Lịch sử giao dịch thanh toán cho CẢ HAI luồng:
    ///   - TOURIST_ACCESS : Du khách mua quyền truy cập app (online, không cần QR kích hoạt)
    ///   - OWNER_SUBSCRIPTION : Chủ POI nâng cấp gói dịch vụ qua web portal
    ///
    /// Sau khi Status = SUCCESS:
    ///   TOURIST_ACCESS     → App verify trực tiếp qua GatewayTransId/ContactInfo → cho vào app
    ///   OWNER_SUBSCRIPTION → Tạo/gia hạn OwnerSubscription + cập nhật Account.SubscriptionPlanId
    ///                        + hạ Priority POI cũ nếu downgrade
    /// </summary>
    public class PaymentTransaction
    {
        /// <summary>PK do server sinh: 'AG-{yyyyMMddHHmmss}-{random6}'</summary>
        public string TransactionId { get; set; } = string.Empty;

        /// <summary>
        /// Phân biệt mục đích thanh toán:
        ///   'TOURIST_ACCESS'     = Du khách mua quyền vào app
        ///   'OWNER_SUBSCRIPTION' = Chủ POI nâng cấp gói
        /// </summary>
        public string PaymentType { get; set; } = "TOURIST_ACCESS";

        /// <summary>
        /// FK → Account.AccountId.
        /// NULL với TOURIST_ACCESS (du khách chưa có tài khoản).
        /// Bắt buộc với OWNER_SUBSCRIPTION.
        /// </summary>
        public string? AccountId { get; set; }

        /// <summary>FK → SubscriptionPlan.PlanId (gói được mua)</summary>
        public string PlanId { get; set; } = string.Empty;

        /// <summary>
        /// FK → OwnerSubscription.SubscriptionId.
        /// NULL khi TOURIST_ACCESS hoặc khi OWNER_SUBSCRIPTION đang PENDING.
        /// Được điền sau khi payment thành công và subscription được tạo.
        /// </summary>
        public string? SubscriptionId { get; set; }

        public decimal Amount { get; set; }
        public string Currency { get; set; } = "VND";

        // ── Payment Gateway ─────────────────────────────────────────────────
        /// <summary>Cổng thanh toán: 'SEPAY' | 'MOMO' | 'MANUAL'</summary>
        public string Gateway { get; set; } = string.Empty;

        /// <summary>Mã giao dịch phía gateway trả về (để đối soát và verify).</summary>
        public string? GatewayTransId { get; set; }

        /// <summary>Trạng thái raw từ gateway (không chuẩn hóa).</summary>
        public string? GatewayStatus { get; set; }

        /// <summary>JSON toàn bộ payload callback từ gateway (debug/audit).</summary>
        public string? GatewayPayload { get; set; }

        // ── Trạng thái nội bộ ───────────────────────────────────────────────
        /// <summary>PENDING | SUCCESS | FAILED | REFUNDED</summary>
        public string Status { get; set; } = "PENDING";

        /// <summary>
        /// SĐT hoặc email du khách — chỉ dùng khi PaymentType = 'TOURIST_ACCESS'.
        /// App dùng field này để verify quyền truy cập khi không có AccountId.
        /// NULL khi PaymentType = 'OWNER_SUBSCRIPTION'.
        /// </summary>
        public string? ContactInfo { get; set; }

        /// <summary>
        /// FK → AppAccessCode.CodeId.
        /// Dự phòng cho v2: sinh QR offline sau khi thanh toán tourist online.
        /// Hiện tại v1: luôn NULL (tourist verify trực tiếp qua GatewayTransId).
        /// </summary>
        public int? ActivationCodeId { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        /// <summary>Thời điểm giao dịch chuyển sang SUCCESS hoặc FAILED.</summary>
        public DateTime? CompletedAt { get; set; }

        // ── Navigation Properties ────────────────────────────────────────────
        public Account?             Account       { get; set; }
        public SubscriptionPlan?    Plan          { get; set; }
        public OwnerSubscription?   Subscription  { get; set; }
        public AppAccessCode?       ActivationCode { get; set; }
    }
}
