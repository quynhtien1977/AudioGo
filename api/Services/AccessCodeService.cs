using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Services.Interfaces;
using Shared.DTOs;

namespace Server.Services
{
    /// <summary>
    /// Triển khai AccessCode business logic, tách ra khỏi CmsAccessCodeController.
    /// </summary>
    public class AccessCodeService : IAccessCodeService
    {
        private readonly AppDbContext _db;

        // Dùng RandomNumberGenerator thay vì System.Random để tránh trùng khi gọi đồng thời
        private static readonly System.Security.Cryptography.RandomNumberGenerator _rng =
            System.Security.Cryptography.RandomNumberGenerator.Create();

        private const string CodeChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        private const int CodeLength = 8;

        public AccessCodeService(AppDbContext db)
        {
            _db = db;
        }

        // ─────────────────────────────────────────────────────────────────────
        // GetPagedAsync
        // ─────────────────────────────────────────────────────────────────────
        public async Task<PagedResult<AccessCodeDto>> GetPagedAsync(int page, int pageSize)
        {
            var query = _db.AppAccessCodes.AsNoTracking().AsQueryable();

            var totalItems = await query.CountAsync();
            var totalPages = (int)Math.Ceiling(totalItems / (double)pageSize);

            var items = await query
                .OrderByDescending(c => c.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(c => new AccessCodeDto(
                    c.CodeId,
                    c.Code,
                    c.Type,
                    c.PlanId,
                    c.DurationDay,
                    c.UsedByDeviceId,
                    c.ActivatedAt,
                    c.ExpireAt,
                    c.CreatedAt))
                .ToListAsync();

            return new PagedResult<AccessCodeDto>(items, totalItems, totalPages, page, pageSize);
        }

        // ─────────────────────────────────────────────────────────────────────
        // CreateCodesAsync
        // ─────────────────────────────────────────────────────────────────────
        public async Task<(List<AccessCodeDto> Created, string? Error)> CreateCodesAsync(int count)
        {
            if (count <= 0 || count > 100)
                return ([], "Count must be between 1 and 100.");

            var newEntities = Enumerable.Range(0, count)
                .Select(_ => new AppAccessCode
                {
                    Code      = GenerateSecureCode(),
                    CreatedAt = DateTime.UtcNow,
                    Type      = "TRIAL"
                })
                .ToList();

            _db.AppAccessCodes.AddRange(newEntities);
            await _db.SaveChangesAsync();

            var created = newEntities.Select(c => new AccessCodeDto(
                c.CodeId, c.Code, c.Type, c.PlanId, c.DurationDay,
                c.UsedByDeviceId, c.ActivatedAt, c.ExpireAt, c.CreatedAt))
                .ToList();

            return (created, null);
        }

        // ─────────────────────────────────────────────────────────────────────
        // DeleteCodeAsync
        // ─────────────────────────────────────────────────────────────────────
        public async Task<bool> DeleteCodeAsync(int id)
        {
            var code = await _db.AppAccessCodes.FindAsync(id);
            if (code is null) return false;

            _db.AppAccessCodes.Remove(code);
            await _db.SaveChangesAsync();
            return true;
        }

        // ── Private Helpers ───────────────────────────────────────────────────

        /// <summary>
        /// Sinh mã ngẫu nhiên an toàn bằng RandomNumberGenerator.
        /// Tránh vấn đề seed trùng khi gọi đồng thời với new Random().
        /// </summary>
        private static string GenerateSecureCode()
        {
            var bytes = new byte[CodeLength];
            _rng.GetBytes(bytes);
            return new string(bytes.Select(b => CodeChars[b % CodeChars.Length]).ToArray());
        }
    }
}
