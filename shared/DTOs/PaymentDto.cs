namespace Shared.DTOs
{
    // ── Filter ───────────────────────────────────────────────────────────────

    /// <summary>Bộ lọc query giao dịch cho Admin (tất cả fields optional).</summary>
    public record PaymentFilter(
        string? PaymentType = null,
        string? Status      = null,
        string? Gateway     = null,
        string? AccountId   = null,
        int     Page        = 1,
        int     PageSize    = 50);

    // ── Summary (Admin list & My list) ────────────────────────────────────────

    /// <summary>Summary giao dịch cho danh sách Admin (có AccountUsername và PlanName).</summary>
    public record PaymentSummaryDto(
        string    TransactionId,
        string    PaymentType,
        string?   AccountId,
        string?   AccountUsername,
        string?   ContactInfo,
        string?   PlanId,
        string?   PlanName,
        decimal   Amount,
        string    Currency,
        string    Gateway,
        string?   GatewayTransId,
        string    Status,
        DateTime  CreatedAt,
        DateTime? CompletedAt);

    /// <summary>Summary giao dịch cho Owner xem lịch sử của chính mình (không có AccountId).</summary>
    public record MyPaymentDto(
        string    TransactionId,
        string    PaymentType,
        string?   PlanName,
        decimal   Amount,
        string    Currency,
        string    Gateway,
        string    Status,
        DateTime  CreatedAt,
        DateTime? CompletedAt);

    // ── Detail ────────────────────────────────────────────────────────────────

    /// <summary>Chi tiết đầy đủ một giao dịch (Admin / Owner xem).</summary>
    public record PaymentDetailDto(
        string    TransactionId,
        string    PaymentType,
        string?   AccountId,
        string?   AccountUsername,
        string?   ContactInfo,
        PaymentPlanDto?          Plan,
        decimal   Amount,
        string    Currency,
        string    Gateway,
        string?   GatewayTransId,
        string?   GatewayStatus,
        string?   GatewayPayload,
        string    Status,
        PaymentSubscriptionDto?  Subscription,
        DateTime  CreatedAt,
        DateTime? UpdatedAt,
        DateTime? CompletedAt);

    /// <summary>Sub-DTO gói cước trong PaymentDetailDto.</summary>
    public record PaymentPlanDto(
        string  PlanId,
        string  Name,
        decimal Price);

    /// <summary>Sub-DTO subscription trong PaymentDetailDto.</summary>
    public record PaymentSubscriptionDto(
        string    SubscriptionId,
        string    Status,
        DateTime? StartDate,
        DateTime? EndDate);
}
