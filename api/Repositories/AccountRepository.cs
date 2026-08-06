using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Repositories
{
    public class AccountRepository : IAccountRepository
    {
        private readonly AppDbContext _db;

        public AccountRepository(AppDbContext db)
        {
            _db = db;
        }

        // ================= GET =================
        public async Task<List<Account>> GetAllAsync()
        {
            return await _db.Accounts.AsNoTracking().Where(a => a.DeletedAt == null).ToListAsync();
        }

        public async Task<Account?> GetByIdAsync(string id)
        {
            var acc = await _db.Accounts.FindAsync(id);
            if (acc == null || acc.DeletedAt != null) return null;
            return acc;
        }

        // 🔥 BONUS (nên có cho login)
        public async Task<Account?> GetByUsernameAsync(string username)
        {
            return await _db.Accounts
                .FirstOrDefaultAsync(x => x.Username == username && x.DeletedAt == null);
        }

        // ================= CREATE =================
        public async Task<Account> CreateAsync(Account account)
        {
            _db.Accounts.Add(account);
            await _db.SaveChangesAsync();
            return account;
        }

        // ================= UPDATE =================
        public async Task<Account> UpdateAsync(Account account)
        {
            _db.Accounts.Update(account);
            await _db.SaveChangesAsync();
            return account;
        }

        // 🔥 Lock / Unlock account
        public async Task<bool> SetLockStatusAsync(string id, bool isLocked)
        {
            var acc = await _db.Accounts.FindAsync(id);
            if (acc == null) return false;

            acc.IsLocked = isLocked;
            acc.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            return true;
        }

        // 🔥 Update role
        public async Task<bool> UpdateRoleAsync(string id, string role)
        {
            var acc = await _db.Accounts.FindAsync(id);
            if (acc == null) return false;

            acc.Role = role;
            acc.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            return true;
        }

        // 🔥 Check username tồn tại
        public async Task<bool> ExistsByUsernameAsync(string username)
        {
            return await _db.Accounts
                .AnyAsync(x => x.Username == username && x.DeletedAt == null);
        }

        // 🔥 Check email tồn tại (excludeAccountId để bỏ qua chính account đang sửa)
        public async Task<bool> ExistsByEmailAsync(string email, string? excludeAccountId = null)
        {
            if (string.IsNullOrWhiteSpace(email)) return false;
            return await _db.Accounts
                .AnyAsync(x => x.Email == email
                            && x.DeletedAt == null
                            && (excludeAccountId == null || x.AccountId != excludeAccountId));
        }

        // ================= DELETE =================
        public async Task<bool> DeleteAsync(string id)
        {
            var acc = await _db.Accounts.FindAsync(id);
            if (acc == null) return false;

            acc.DeletedAt = DateTime.UtcNow;
            acc.IsLocked = true; // cũng lock để ngăn login tức thời
            acc.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return true;
        }

        // ================= GUARDS =================
        /// <summary>Đếm Admin đang active (IsLocked = false). Dùng cho Last Admin Rule.</summary>
        public Task<int> CountActiveAdminsAsync() =>
            _db.Accounts.CountAsync(a => a.Role == "Admin" && !a.IsLocked);
    }
}