using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Services.Interfaces;
using Shared.DTOs;
using System.Security.Claims;

namespace Server.Controllers.Cms
{
    /// <summary>
    /// Xem lịch sử giao dịch thanh toán.
    /// Admin: xem tất cả. Owner: chỉ xem của mình (/my).
    /// Mọi DB query đã được delegate sang IPaymentQueryService.
    /// </summary>
    [ApiController]
    [Route("api/cms/payments")]
    [Authorize]
    public class CmsPaymentController : ControllerBase
    {
        private readonly IPaymentQueryService _payments;

        public CmsPaymentController(IPaymentQueryService payments) => _payments = payments;

        private string? CurrentUserId() =>
            User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        /// <summary>GET /api/cms/payments — Filter: paymentType, status, gateway, accountId, page, pageSize</summary>
        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAll(
            [FromQuery] string? paymentType = null,
            [FromQuery] string? status      = null,
            [FromQuery] string? gateway     = null,
            [FromQuery] string? accountId   = null,
            [FromQuery] int     page        = 1,
            [FromQuery] int     pageSize    = 50)
        {
            var filter = new PaymentFilter(paymentType, status, gateway, accountId, page, pageSize);
            var result = await _payments.GetAllAsync(filter);
            return Ok(result);
        }

        /// <summary>GET /api/cms/payments/my — Owner xem giao dịch của chính mình</summary>
        [HttpGet("my")]
        public async Task<IActionResult> GetMy(
            [FromQuery] int page     = 1,
            [FromQuery] int pageSize = 20)
        {
            var userId = CurrentUserId();
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var result = await _payments.GetMyAsync(userId, page, pageSize);
            return Ok(result);
        }

        /// <summary>GET /api/cms/payments/{transactionId} — Chi tiết 1 giao dịch</summary>
        [HttpGet("{transactionId}")]
        public async Task<IActionResult> GetById(string transactionId)
        {
            var detail = await _payments.GetByIdAsync(transactionId);
            if (detail is null) return NotFound();

            // IDOR guard: Owner chỉ được xem giao dịch của chính mình
            var isAdmin = User.IsInRole("Admin");
            if (!isAdmin && detail.AccountId != CurrentUserId())
                return Forbid();

            return Ok(detail);
        }
    }
}
