using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Server.Helpers;
using Server.Models;
using Server.Repositories.Interfaces;
using Server.Services.Interfaces;
using Shared.DTOs;
using System.Security.Claims;

namespace Server.Controllers.Cms
{
    [ApiController]
    [Route("api/cms/accounts")]
    [Authorize(Roles = "Admin")]
    [EnableCors("WebCmsPolicy")]
    public class CmsAccountController : ControllerBase
    {
        private readonly IAccountRepository _accounts;
        private readonly IEmailService _email;

        public CmsAccountController(IAccountRepository accounts, IEmailService email)
        {
            _accounts = accounts;
            _email    = email;
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
        public async Task<IActionResult> Create([FromBody] AccountCreateRequest req)
        {
            // 🔥 check username trùng
            if (await _accounts.ExistsByUsernameAsync(req.Username))
                return BadRequest("Username đã tồn tại");

            // 🔥 check email trùng
            if (!string.IsNullOrWhiteSpace(req.Email) && await _accounts.ExistsByEmailAsync(req.Email))
                return BadRequest("Email này đã được sử dụng bởi tài khoản khác.");

            // ── 🛡️ V-BE: Validate email + SĐT ───────────────────────────────────
            var (validCreate, errCreate) = ValidateContactInfo(req.Email, req.PhoneNumber);
            if (!validCreate) return BadRequest(errCreate);

            // ── Sinh mật khẩu ngẫu nhiên (crypto-safe) ─────────────────────────
            var plainPassword = PasswordGenerator.Generate();

            var account = new Account
            {
                AccountId    = Guid.NewGuid().ToString(),
                Username     = req.Username,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(plainPassword),
                Role         = req.Role,

                FullName    = req.FullName,
                Email       = req.Email,
                PhoneNumber = req.PhoneNumber,

                MustChangePassword = true,
                IsLocked  = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            var created = await _accounts.CreateAsync(account);

            // ── Gửi email chào mừng + mật khẩu tạm ────────────────────────────
            string? emailWarning = null;
            if (!string.IsNullOrWhiteSpace(created.Email))
            {
                var sent = await _email.SendAccountCreatedEmailAsync(
                    created.Email,
                    created.FullName ?? created.Username,
                    created.Username,
                    plainPassword,
                    created.PhoneNumber);

                if (!sent)
                    emailWarning = "Tạo tài khoản thành công nhưng gửi email thất bại. " +
                                   "Vui lòng cấp mật khẩu thủ công cho người dùng.";
            }

            var response = new AccountCreateResponse
            {
                Account      = ToDto(created),
                EmailWarning = emailWarning
            };

            return CreatedAtAction(
                nameof(GetById),
                new { id = created.AccountId },
                response);
        }

        // ======================
        // 🟢 UPDATE MY PROFILE (self)
        // Endpoint riêng cho Owner/Admin tự sửa thông tin cá nhân.
        // KHÔNG có Guard R1 — được phép sửa chính mình.
        // KHÔNG cho phép đổi Role hay IsLocked qua endpoint này.
        // ======================
        // PUT /me — mọi role đã login đều được sửa profile của chính mình
        [HttpPut("me")]
        [Authorize] // override class-level Admin restriction
        public async Task<ActionResult<AccountDto>> UpdateMyProfile(
            [FromBody] ProfileUpdateRequest req)
        {
            var currentUserId = GetCurrentUserId();
            var existing = await _accounts.GetByIdAsync(currentUserId);
            if (existing is null) return NotFound();

            // ── 🛡️ V-BE: Validate email + SĐT ───────────────────────────────────────
            var (validMe, errMe) = ValidateContactInfo(req.Email, req.PhoneNumber);
            if (!validMe) return BadRequest(errMe);

            // 🔥 check email trùng (loại trừ chính mình)
            if (!string.IsNullOrWhiteSpace(req.Email) && await _accounts.ExistsByEmailAsync(req.Email, currentUserId))
                return BadRequest("Email này đã được sử dụng bởi tài khoản khác.");

            if (!string.IsNullOrWhiteSpace(req.FullName))
                existing.FullName = req.FullName;
            if (!string.IsNullOrWhiteSpace(req.Email))
                existing.Email = req.Email;
            if (!string.IsNullOrWhiteSpace(req.PhoneNumber))
                existing.PhoneNumber = req.PhoneNumber;

            existing.UpdatedAt = DateTime.UtcNow;
            var updated = await _accounts.UpdateAsync(existing);
            return Ok(ToDto(updated));
        }

        // ======================
        // 🟢 UPDATE (admin quản lý user khác)
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
                a.SubscriptionPlanId,

                a.CreatedAt,
                a.UpdatedAt
            );
        }

        // ======================
        // 🔧 VALIDATION HELPER
        // Backend guard: kiểm tra format email + SĐT.
        // Frontend đã check trước, đây là lớp bảo vệ thứ 2 chống bypass API.
        // ======================
        private static (bool ok, string error) ValidateContactInfo(string? email, string? phone)
        {
            if (!string.IsNullOrWhiteSpace(email))
            {
                var emailRegex = new System.Text.RegularExpressions.Regex(
                    @"^[^\s@]+@[^\s@]+\.[^\s@]{2,}$");
                if (!emailRegex.IsMatch(email))
                    return (false, "Email không đúng định dạng.");
            }

            if (!string.IsNullOrWhiteSpace(phone))
            {
                var phoneRegex = new System.Text.RegularExpressions.Regex(
                    @"^(0[3-9][0-9]{8}|(\+84)[3-9][0-9]{8})$");
                if (!phoneRegex.IsMatch(phone))
                    return (false, "Số điện thoại không hợp lệ. Nhập 10 số bắt đầu bằng 0 hoặc +84.");
            }

            return (true, "");
        }
    }
}