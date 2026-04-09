using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories.Interfaces;
using Shared.DTOs;

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
                return BadRequest("Username already exists");

            var account = new Account
            {
                AccountId = Guid.NewGuid().ToString(),
                Username = req.Username,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
                Role = req.Role,

                FullName = req.FullName,
                Email = req.Email,
                PhoneNumber = req.PhoneNumber,

                IsLocked = false, // mặc định

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
            var existing = await _accounts.GetByIdAsync(id);
            if (existing == null) return NotFound();

            // basic fields
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