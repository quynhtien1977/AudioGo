using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Helpers;
using Server.Services.Interfaces;
using Shared.DTOs;

namespace Server.Services
{
    /// <summary>
    /// Triển khai payment query logic, tách ra khỏi CmsPaymentController.
    /// </summary>
    public class PaymentQueryService : IPaymentQueryService
    {
        private readonly AppDbContext _db;

        public PaymentQueryService(AppDbContext db) => _db = db;

        // ─────────────────────────────────────────────────────────────────────
        // GetAllAsync (Admin)
        // ─────────────────────────────────────────────────────────────────────
        public async Task<PagedResult<PaymentSummaryDto>> GetAllAsync(PaymentFilter filter)
        {
            var (page, pageSize) = PaginationHelper.Normalize(filter.Page, filter.PageSize, maxPageSize: 200);
            var query = _db.PaymentTransactions.AsNoTracking();

            if (!string.IsNullOrEmpty(filter.PaymentType)) query = query.Where(t => t.PaymentType == filter.PaymentType);
            if (!string.IsNullOrEmpty(filter.Status))      query = query.Where(t => t.Status      == filter.Status);
            if (!string.IsNullOrEmpty(filter.Gateway))     query = query.Where(t => t.Gateway     == filter.Gateway);
            if (!string.IsNullOrEmpty(filter.AccountId))   query = query.Where(t => t.AccountId   == filter.AccountId);

            var total = await query.CountAsync();
            var totalPages = (int)Math.Ceiling(total / (double)pageSize);

            var items = await query
                .OrderByDescending(t => t.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(t => new PaymentSummaryDto(
                    t.TransactionId,
                    t.PaymentType,
                    t.AccountId,
                    t.Account != null ? t.Account.Username : null,
                    t.ContactInfo,
                    t.PlanId,
                    t.Plan != null ? t.Plan.Name : null,
                    t.Amount,
                    t.Currency,
                    t.Gateway,
                    t.GatewayTransId,
                    t.Status,
                    t.CreatedAt,
                    t.CompletedAt))
                .ToListAsync();

            return new PagedResult<PaymentSummaryDto>(items, total, totalPages, page, pageSize);
        }

        // ─────────────────────────────────────────────────────────────────────
        // GetMyAsync (Owner)
        // ─────────────────────────────────────────────────────────────────────
        public async Task<PagedResult<MyPaymentDto>> GetMyAsync(string accountId, int page, int pageSize)
        {
            var (safePage, safePageSize) = PaginationHelper.Normalize(page, pageSize);
            var query = _db.PaymentTransactions
                .AsNoTracking()
                .Where(t => t.AccountId == accountId);

            var total = await query.CountAsync();
            var totalPages = (int)Math.Ceiling(total / (double)safePageSize);

            var items = await query
                .OrderByDescending(t => t.CreatedAt)
                .Skip((safePage - 1) * safePageSize)
                .Take(safePageSize)
                .Select(t => new MyPaymentDto(
                    t.TransactionId,
                    t.PaymentType,
                    t.Plan != null ? t.Plan.Name : null,
                    t.Amount,
                    t.Currency,
                    t.Gateway,
                    t.Status,
                    t.CreatedAt,
                    t.CompletedAt))
                .ToListAsync();

            return new PagedResult<MyPaymentDto>(items, total, totalPages, safePage, safePageSize);
        }

        // ─────────────────────────────────────────────────────────────────────
        // GetByIdAsync (Detail)
        // ─────────────────────────────────────────────────────────────────────
        public async Task<PaymentDetailDto?> GetByIdAsync(string transactionId)
        {
            var tx = await _db.PaymentTransactions
                .AsNoTracking()
                .Include(t => t.Account)
                .Include(t => t.Plan)
                .Include(t => t.Subscription)
                .FirstOrDefaultAsync(t => t.TransactionId == transactionId);

            if (tx is null) return null;

            var plan = tx.Plan is not null
                ? new PaymentPlanDto(tx.Plan.PlanId, tx.Plan.Name, tx.Plan.Price)
                : null;

            var sub = tx.Subscription is not null
                ? new PaymentSubscriptionDto(
                    tx.Subscription.SubscriptionId,
                    tx.Subscription.Status,
                    tx.Subscription.StartDate,
                    tx.Subscription.EndDate)
                : null;

            return new PaymentDetailDto(
                tx.TransactionId,
                tx.PaymentType,
                tx.AccountId,
                tx.Account?.Username,
                tx.ContactInfo,
                plan,
                tx.Amount,
                tx.Currency,
                tx.Gateway,
                tx.GatewayTransId,
                tx.GatewayStatus,
                tx.GatewayPayload,
                tx.Status,
                sub,
                tx.CreatedAt,
                tx.UpdatedAt,
                tx.CompletedAt);
        }
    }
}
