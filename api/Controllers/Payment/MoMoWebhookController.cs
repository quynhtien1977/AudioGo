using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Server.Services;
using System.Text.Json;

namespace Server.Controllers.Payment
{
    /// <summary>
    /// Webhook IPN endpoint cho MoMo.
    /// Route: POST /api/payment/momo/webhook
    ///
    /// MoMo gọi endpoint này ngay sau khi giao dịch hoàn tất.
    /// Cấu hình URL này trong MoMo Developer Portal.
    ///
    /// Cấu hình appsettings.json:
    ///   "Payment": { "MoMo": { "SecretKey": "your-secret-key", "AccessKey": "your-access-key" } }
    /// </summary>
    [ApiController]
    [Route("api/payment/momo")]
    [EnableCors("PaymentWebhookPolicy")]
    public class MoMoWebhookController : ControllerBase
    {
        private readonly PaymentWebhookService _webhook;
        private readonly ILogger<MoMoWebhookController> _logger;

        public MoMoWebhookController(
            PaymentWebhookService webhook,
            ILogger<MoMoWebhookController> logger)
        {
            _webhook = webhook;
            _logger  = logger;
        }

        [HttpPost("webhook")]
        public async Task<IActionResult> Receive([FromBody] JsonElement body)
        {
            var rawPayload = body.GetRawText();
            _logger.LogInformation("MoMo IPN received: {Payload}", rawPayload[..Math.Min(500, rawPayload.Length)]);

            // TODO v2: Verify HMAC signature từ MoMo để chống giả mạo
            // var signature = TryGet(body, "signature");
            // if (!VerifyMoMoSignature(body, signature)) return Unauthorized();

            var dto = new PaymentWebhookService.MoMoCallbackDto(
                OrderId:    TryGet(body, "orderId"),
                TransId:    TryGet(body, "transId"),
                ResultCode: TryGetInt(body, "resultCode") ?? 99,
                Amount:     TryGetDecimal(body, "amount") ?? 0,
                Message:    TryGet(body, "message")
            );

            var result = await _webhook.HandleMoMoAsync(dto, rawPayload);

            if (!result.Success)
            {
                _logger.LogError("MoMo IPN processing failed: {Message}", result.Message);
                return BadRequest(new { message = result.Message });
            }

            // MoMo IPN: trả về 204 No Content hoặc 200 OK
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

        private static int? TryGetInt(JsonElement el, string key)
        {
            try { return el.GetProperty(key).GetInt32(); }
            catch { return null; }
        }
    }
}
