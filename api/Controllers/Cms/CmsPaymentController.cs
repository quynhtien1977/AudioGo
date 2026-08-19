using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Data;

namespace Server.Controllers.Cms
{
    /// <summary>
    /// Xem lịch sử giao dịch thanh toán.
    /// Admin: xem tất cả. Owner: chỉ xem của mình (/my).
    /// </summary>
    [ApiController]
    [Route("api/cms/payments")]
    [Authorize]
    public class CmsPaymentController : ControllerBase
    {
        private readonly AppDbContext _db;

        public CmsPaymentController(AppDbContext db) => _db = db;

        private string? CurrentUserId() => User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

        /// <summary>
        /// GET /api/cms/payments
        /// Filter: paymentType, status, gateway, accountId, page, pageSize
        /// </summary>
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
            var query = _db.PaymentTransactions.AsNoTracking();

            if (!string.IsNullOrEmpty(paymentType)) query = query.Where(t => t.PaymentType == paymentType);
            if (!string.IsNullOrEmpty(status))      query = query.Where(t => t.Status      == status);
            if (!string.IsNullOrEmpty(gateway))     query = query.Where(t => t.Gateway     == gateway);
            if (!string.IsNullOrEmpty(accountId))   query = query.Where(t => t.AccountId   == accountId);

            var total = await query.CountAsync();
            var items = await query
                .OrderByDescending(t => t.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(t => new
                {
                    t.TransactionId,
                    t.PaymentType,
                    t.AccountId,
                    AccountUsername = t.Account != null ? t.Account.Username : null,
                    t.ContactInfo,
                    t.PlanId,
                    t.Amount,
                    t.Currency,
                    t.Gateway,
                    t.GatewayTransId,
                    t.Status,
                    t.CreatedAt,
                    t.CompletedAt
                })
                .ToListAsync();

            return Ok(new
            {
                data       = items,
                pagination = new { total, page, pageSize, totalPages = (int)Math.Ceiling(total / (double)pageSize) }
            });
        }

        /// <summary>GET /api/cms/payments/my — Owner xem giao dịch của chính mình</summary>
        [HttpGet("my")]
        public async Task<IActionResult> GetMy(
            [FromQuery] int page     = 1,
            [FromQuery] int pageSize = 20)
        {
            var userId = CurrentUserId();
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var query = _db.PaymentTransactions
                .AsNoTracking()
                .Where(t => t.AccountId == userId);

            var total = await query.CountAsync();
            var items = await query
                .OrderByDescending(t => t.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(t => new
                {
                    t.TransactionId,
                    t.PaymentType,
                    PlanName = t.Plan != null ? t.Plan.Name : null,
                    t.Amount,
                    t.Currency,
                    t.Gateway,
                    t.Status,
                    t.CreatedAt,
                    t.CompletedAt
                })
                .ToListAsync();

            return Ok(new
            {
                data       = items,
                pagination = new { total, page, pageSize, totalPages = (int)Math.Ceiling(total / (double)pageSize) }
            });
        }

        /// <summary>GET /api/cms/payments/{transactionId} — Chi tiết 1 giao dịch</summary>
        [HttpGet("{transactionId}")]
        public async Task<IActionResult> GetById(string transactionId)
        {
            var tx = await _db.PaymentTransactions
                .AsNoTracking()
                .Include(t => t.Account)
                .Include(t => t.Plan)
                .Include(t => t.Subscription)
                .FirstOrDefaultAsync(t => t.TransactionId == transactionId);

            if (tx == null) return NotFound();

            return Ok(new
            {
                tx.TransactionId,
                tx.PaymentType,
                tx.AccountId,
                AccountUsername = tx.Account?.Username,
                tx.ContactInfo,
                plan          = new { tx.Plan!.PlanId, tx.Plan.Name, tx.Plan.Price },
                tx.Amount,
                tx.Currency,
                tx.Gateway,
                tx.GatewayTransId,
                tx.GatewayStatus,
                tx.GatewayPayload,
                tx.Status,
                subscription  = tx.Subscription == null ? null : new
                {
                    tx.Subscription.SubscriptionId,
                    tx.Subscription.Status,
                    tx.Subscription.StartDate,
                    tx.Subscription.EndDate
                },
                tx.CreatedAt,
                tx.UpdatedAt,
                tx.CompletedAt
            });
        }
    }
}
