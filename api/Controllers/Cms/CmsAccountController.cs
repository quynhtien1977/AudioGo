using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories.Interfaces;
using Shared.DTOs;
using System.Security.Claims;

namespace Server.Controllers.Cms
{
    [ApiController]
    [Route("api/cms/accounts")]
    [Authorize]
    [EnableCors("WebCmsPolicy")]
    public class CmsAccountController : ControllerBase
    {
        private readonly IAccountRepository _accounts;

        public CmsAccountController(IAccountRepository accounts)
        {
            _accounts = accounts;
        }

        // ── Helper: lấy AccountId của người đang gọi API từ JWT claim ──────────
        private string GetCurrentUserId() =>
            User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new UnauthorizedAccessException("Không tìm thấy thông tin người dùng trong token.");

        // ======================
        // 🟢 GET ALL
        // ======================
        [HttpGet]
        public async Task<ActionResult<List<AccountDto>>> GetAll()
        {
            var accounts = await _accounts.GetAllAsync();
            return Ok(accounts.Select(ToDto).ToList());
        }

        // ======================
        // 🟢 GET BY ID
        // ======================
        [HttpGet("{id}")]
        public async Task<ActionResult<AccountDto>> GetById(string id)
        {
            var acc = await _accounts.GetByIdAsync(id);
            if (acc == null) return NotFound();

            return Ok(ToDto(acc));
        }

        // ======================
        // 🟢 CREATE
        // ======================
        [HttpPost]
        public async Task<ActionResult<AccountDto>> Create([FromBody] AccountCreateRequest req)
        {
            // 🔥 check username trùng
            if (await _accounts.ExistsByUsernameAsync(req.Username))
                return BadRequest("Username đã tồn tại");

            var account = new Account
            {
                AccountId    = Guid.NewGuid().ToString(),
                Username     = req.Username,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
                Role         = req.Role,

                FullName    = req.FullName,
                Email       = req.Email,
                PhoneNumber = req.PhoneNumber,

                IsLocked  = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            var created = await _accounts.CreateAsync(account);

            return CreatedAtAction(
                nameof(GetById),
                new { id = created.AccountId },
                ToDto(created)
            );
        }

        // ======================
        // 🟢 UPDATE
        // ======================
        [HttpPut("{id}")]
        public async Task<ActionResult<AccountDto>> Update(
            string id,
            [FromBody] AccountUpdateRequest req)
        {
            var currentUserId = GetCurrentUserId();

            // ── 🛡️ GUARD R1: Tự bảo vệ ────────────────────────────────────────
            if (id == currentUserId)
                return BadRequest("Không thể sửa đổi tài khoản của chính mình tại đây. Vui lòng sử dụng trang Profile.");

            var existing = await _accounts.GetByIdAsync(id);
            if (existing == null) return NotFound();

            // ── 🛡️ GUARD R2: Last Admin Rule ────────────────────────────────────
            bool isTargetActiveAdmin = existing.Role == "Admin" && !existing.IsLocked;
            bool isChangingRole      = !string.IsNullOrWhiteSpace(req.Role) && req.Role != existing.Role;
            bool isLocking           = req.IsLocked == true && !existing.IsLocked;

            if (isTargetActiveAdmin && (isChangingRole || isLocking))
            {
                var activeAdminCount = await _accounts.CountActiveAdminsAsync();
                if (activeAdminCount <= 1)
                    return BadRequest("Không thể thay đổi role hoặc khóa tài khoản Admin duy nhất còn lại. Hệ thống cần ít nhất 1 Admin active.");
            }

            // ── Cập nhật các field được phép ────────────────────────────────────
            if (!string.IsNullOrWhiteSpace(req.Username))
                existing.Username = req.Username;

            if (!string.IsNullOrWhiteSpace(req.Password))
                existing.PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password);

            if (!string.IsNullOrWhiteSpace(req.Role))
                existing.Role = req.Role;

            if (req.FullName != null)
                existing.FullName = req.FullName;

            if (req.Email != null)
                existing.Email = req.Email;

            if (req.PhoneNumber != null)
                existing.PhoneNumber = req.PhoneNumber;

            if (req.IsLocked.HasValue)
                existing.IsLocked = req.IsLocked.Value;

            existing.UpdatedAt = DateTime.UtcNow;

            var updated = await _accounts.UpdateAsync(existing);

            return Ok(ToDto(updated));
        }

        // ======================
        // 🟢 DELETE
        // ======================
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var currentUserId = GetCurrentUserId();

            // ── 🛡️ GUARD R1: Tự bảo vệ ────────────────────────────────────────
            if (id == currentUserId)
                return BadRequest("Không thể xóa tài khoản của chính mình.");

            // ── 🛡️ GUARD R2: Last Admin Rule ────────────────────────────────────
            var target = await _accounts.GetByIdAsync(id);
            if (target?.Role == "Admin" && !target.IsLocked)
            {
                var activeAdminCount = await _accounts.CountActiveAdminsAsync();
                if (activeAdminCount <= 1)
                    return BadRequest("Không thể xóa tài khoản Admin duy nhất còn lại. Hệ thống cần ít nhất 1 Admin active.");
            }

            var ok = await _accounts.DeleteAsync(id);
            return ok ? NoContent() : NotFound();
        }

        // ======================
        // 🔧 MAPPING
        // ======================
        private static AccountDto ToDto(Account a)
        {
            return new AccountDto(
                a.AccountId,
                a.Username,
                a.Role,

                a.FullName,
                a.Email,
                a.PhoneNumber,
                a.IsLocked,

                a.CreatedAt,
                a.UpdatedAt
            );
        }
    }
}