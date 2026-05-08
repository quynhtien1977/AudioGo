using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Server.Services;
using System.Text.Json;

namespace Server.Controllers.Payment
{
    /// <summary>
    /// Webhook endpoint cho SePay.
    /// Route: POST /api/payment/sepay/webhook
    ///
    /// SePay gọi endpoint này khi phát hiện giao dịch thành công trong tài khoản ngân hàng.
    /// Không cần authentication (public endpoint) nhưng cần verify API key trong header.
    ///
    /// Cấu hình appsettings.json:
    ///   "Payment": { "SePay": { "ApiKey": "your-sepay-api-key" } }
    /// </summary>
    [ApiController]
    [Route("api/payment/sepay")]
    [EnableCors("PaymentWebhookPolicy")]
    public class SePayWebhookController : ControllerBase
    {
        private readonly PaymentWebhookService _webhook;
        private readonly IConfiguration        _config;
        private readonly ILogger<SePayWebhookController> _logger;

        public SePayWebhookController(
            PaymentWebhookService webhook,
            IConfiguration        config,
            ILogger<SePayWebhookController> logger)
        {
            _webhook = webhook;
            _config  = config;
            _logger  = logger;
        }

        [HttpPost("webhook")]
        public async Task<IActionResult> Receive([FromBody] JsonElement body)
        {
            // ── Verify API key từ SePay (header Authorization hoặc query param) ──
            var authHeader = Request.Headers["Authorization"].ToString();
            var apiKey = authHeader.Replace("Bearer ", "", StringComparison.OrdinalIgnoreCase)
                                   .Replace("Apikey ", "", StringComparison.OrdinalIgnoreCase).Trim();
            
            if (string.IsNullOrEmpty(apiKey) || apiKey != _config["Payment:SePay:ApiKey"])
            {
                _logger.LogWarning("SePay webhook: API key không hợp lệ từ IP={IP}", HttpContext.Connection.RemoteIpAddress);
                return Unauthorized();
            }

            var rawPayload = body.GetRawText();
            _logger.LogInformation("SePay webhook received: {Payload}", rawPayload[..Math.Min(500, rawPayload.Length)]);

            // Parse fields từ SePay payload
            // Tham khảo: https://docs.sepay.vn/webhook
            var dto = new PaymentWebhookService.SePayCallbackDto(
                ReferenceCode:         TryGet(body, "referenceCode"),
                TransferContent:       TryGet(body, "transferContent") ?? TryGet(body, "content"),
                AccountNumber:         TryGet(body, "toAccountNumber"),
                Amount:                TryGetDecimal(body, "transferAmount") ?? TryGetDecimal(body, "amount") ?? 0,
                GatewayTransactionId:  TryGet(body, "id") ?? TryGet(body, "transactionId")
            );

            var result = await _webhook.HandleSePayAsync(dto, rawPayload);

            if (!result.Success)
            {
                _logger.LogError("SePay webhook processing failed: {Message}", result.Message);
                return BadRequest(new { message = result.Message });
            }

            // SePay yêu cầu trả về HTTP 200 với body { "success": true }
            return Ok(new { success = true, message = result.Message });
        }

        private static string? TryGet(JsonElement el, string key)
        {
            try { return el.GetProperty(key).GetString(); }
            catch { return null; }
        }

        private static decimal? TryGetDecimal(JsonElement el, string key)
        {
            try { return el.GetProperty(key).GetDecimal(); }
            catch { return null; }
        }
    }
}
