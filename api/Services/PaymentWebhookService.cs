using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using System.Text.Json;

namespace Server.Services
{
    /// <summary>
    /// Xử lý webhook callback từ SePay và MoMo.
    /// Phân nhánh theo PaymentType:
    ///   TOURIST_ACCESS     → Đánh dấu giao dịch SUCCESS, app verify trực tiếp
    ///   OWNER_SUBSCRIPTION → Kích hoạt / gia hạn OwnerSubscription
    /// </summary>
    public class PaymentWebhookService
    {
        private readonly AppDbContext          _db;
        private readonly SubscriptionService   _subscription;
        private readonly ILogger<PaymentWebhookService> _logger;

        // ── SePay config (lấy từ IConfiguration) ─────────────────────────────
        private readonly string _sePayApiKey;
        private readonly string _moMoSecretKey;

        public PaymentWebhookService(
            AppDbContext          db,
            SubscriptionService   subscription,
            IConfiguration        config,
            ILogger<PaymentWebhookService> logger)
        {
            _db           = db;
            _subscription = subscription;
            _logger       = logger;
            _sePayApiKey  = config["Payment:SePay:ApiKey"]  ?? string.Empty;
            _moMoSecretKey = config["Payment:MoMo:SecretKey"] ?? string.Empty;
        }

        // ═══════════════════════════════════════════════════════════════════
        //  SePay Webhook
        // ═══════════════════════════════════════════════════════════════════

        public record SePayCallbackDto(
            string? ReferenceCode,   // TransactionId của hệ thống (mã embed trong nội dung chuyển khoản)
            string? TransferContent, // Nội dung CK (dùng để parse TransactionId nếu không có ReferenceCode)
            string? AccountNumber,   // Số tài khoản nhận
            decimal Amount,
            string? GatewayTransactionId
        );

        /// <summary>
        /// Xử lý callback từ SePay.
        /// SePay gửi webhook khi phát hiện giao dịch thành công.
        /// TransactionId được embed trong nội dung chuyển khoản hoặc ReferenceCode.
        /// </summary>
        public async Task<WebhookResult> HandleSePayAsync(SePayCallbackDto dto, string rawPayload)
        {
            // 1. Parse TransactionId từ nội dung CK
            var txId = ExtractTransactionId(dto.ReferenceCode, dto.TransferContent);
            if (string.IsNullOrEmpty(txId))
            {
                _logger.LogWarning("SePay webhook: không tìm thấy TransactionId trong payload. Content={Content}", dto.TransferContent);
                return WebhookResult.Ignored("Không tìm thấy mã giao dịch trong nội dung CK");
            }

            return await ProcessPaymentAsync(txId, "SEPAY", dto.GatewayTransactionId, dto.Amount, rawPayload);
        }

        // ═══════════════════════════════════════════════════════════════════
        //  MoMo Webhook
        // ═══════════════════════════════════════════════════════════════════

        public record MoMoCallbackDto(
            string? OrderId,         // TransactionId của hệ thống
            string? TransId,         // Mã GD phía MoMo
            int ResultCode,          // 0 = success
            decimal Amount,
            string? Message
        );

        /// <summary>
        /// Xử lý IPN callback từ MoMo.
        /// OrderId chứa TransactionId của hệ thống (được set khi tạo payment request).
        /// </summary>
        public async Task<WebhookResult> HandleMoMoAsync(MoMoCallbackDto dto, string rawPayload)
        {
            if (dto.ResultCode != 0)
            {
                _logger.LogInformation("MoMo IPN: giao dịch thất bại. OrderId={OrderId} ResultCode={Code} Msg={Msg}",
                    dto.OrderId, dto.ResultCode, dto.Message);
                return WebhookResult.Ignored($"MoMo ResultCode={dto.ResultCode}: {dto.Message}");
            }

            if (string.IsNullOrEmpty(dto.OrderId))
                return WebhookResult.Failed("OrderId trống");

            return await ProcessPaymentAsync(dto.OrderId, "MOMO", dto.TransId, dto.Amount, rawPayload);
        }

        // ═══════════════════════════════════════════════════════════════════
        //  Core: xử lý payment sau khi xác nhận thành công
        // ═══════════════════════════════════════════════════════════════════

        private async Task<WebhookResult> ProcessPaymentAsync(
            string txId, string gateway, string? gatewayTransId, decimal amount, string rawPayload)
        {
            // Idempotency: nếu đã SUCCESS thì bỏ qua (webhook có thể gửi nhiều lần)
            var tx = await _db.PaymentTransactions.FirstOrDefaultAsync(t => t.TransactionId == txId);
            if (tx == null)
            {
                _logger.LogWarning("Webhook {Gateway}: TransactionId={TxId} không tồn tại trong DB", gateway, txId);
                return WebhookResult.Ignored("TransactionId không tìm thấy");
            }

            if (tx.Status == "SUCCESS")
            {
                _logger.LogInformation("Webhook {Gateway}: TransactionId={TxId} đã SUCCESS trước đó, bỏ qua", gateway, txId);
                return WebhookResult.Ok("Đã xử lý trước đó (idempotent)");
            }

            // Kiểm tra số tiền khớp (tránh thiếu tiền)
            if (Math.Abs(tx.Amount - amount) > 1) // sai lệch cho phép 1 VND
            {
                _logger.LogWarning("Webhook {Gateway}: Amount không khớp. Expected={Expected} Got={Got}", gateway, tx.Amount, amount);
                return WebhookResult.Failed($"Số tiền không khớp: expected {tx.Amount}, got {amount}");
            }

            // Cập nhật transaction
            tx.Status          = "SUCCESS";
            tx.GatewayTransId  = gatewayTransId;
            tx.GatewayStatus   = "SUCCESS";
            tx.GatewayPayload  = rawPayload;
            tx.Gateway         = gateway;
            tx.UpdatedAt       = DateTime.UtcNow;
            tx.CompletedAt     = DateTime.UtcNow;

            // Rẽ nhánh theo PaymentType
            if (tx.PaymentType == "OWNER_SUBSCRIPTION")
            {
                if (string.IsNullOrEmpty(tx.AccountId))
                    return WebhookResult.Failed("OWNER_SUBSCRIPTION thiếu AccountId");

                var sub = await _subscription.ActivateSubscriptionAsync(
                    tx.AccountId, tx.PlanId, tx.TransactionId);

                tx.SubscriptionId = sub.SubscriptionId;

                _logger.LogInformation(
                    "Owner subscription activated: Account={AccountId} Plan={PlanId}",
                    tx.AccountId, tx.PlanId);
            }
            else // TOURIST_ACCESS
            {
                // App mobile sẽ verify bằng cách gọi API kiểm tra PaymentTransaction
                // theo ContactInfo (SĐT/email) hoặc GatewayTransId
                _logger.LogInformation(
                    "Tourist access payment success: ContactInfo={Contact} GatewayTransId={GwId}",
                    tx.ContactInfo, gatewayTransId);
            }

            await _db.SaveChangesAsync();
            return WebhookResult.Ok("Xử lý thành công");
        }

        // ═══════════════════════════════════════════════════════════════════
        //  Helper: Parse TransactionId từ nội dung chuyển khoản SePay
        // ═══════════════════════════════════════════════════════════════════

        /// <summary>
        /// TransactionId theo format "AG-{yyyyMMddHHmmss}-{XXXXXX}"
        /// Được embed vào nội dung CK bởi client: "Thanh toan AG-20260507-ABC123"
        /// </summary>
        private static string? ExtractTransactionId(string? referenceCode, string? transferContent)
        {
            // Ưu tiên ReferenceCode nếu có
            if (!string.IsNullOrEmpty(referenceCode) && referenceCode.StartsWith("AG-"))
                return referenceCode;

            // Parse từ nội dung CK
            if (string.IsNullOrEmpty(transferContent))
                return null;

            var parts = transferContent.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            return parts.FirstOrDefault(p => p.StartsWith("AG-"));
        }
    }

    // ── Result type ────────────────────────────────────────────────────────
    public record WebhookResult(bool Success, bool ShouldIgnore, string Message)
    {
        public static WebhookResult Ok(string msg)      => new(true,  false, msg);
        public static WebhookResult Ignored(string msg) => new(true,  true,  msg);
        public static WebhookResult Failed(string msg)  => new(false, false, msg);
    }
}
