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
            return await _db.Accounts.AsNoTracking().ToListAsync();
        }

        public async Task<Account?> GetByIdAsync(string id)
        {
            return await _db.Accounts.FindAsync(id);
        }

        // 🔥 BONUS (nên có cho login)
        public async Task<Account?> GetByUsernameAsync(string username)
        {
            return await _db.Accounts
                .FirstOrDefaultAsync(x => x.Username == username);
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
                .AnyAsync(x => x.Username == username);
        }

        // ================= DELETE =================
        public async Task<bool> DeleteAsync(string id)
        {
            var acc = await _db.Accounts.FindAsync(id);
            if (acc == null) return false;

            _db.Accounts.Remove(acc);
            await _db.SaveChangesAsync();
            return true;
        }
    }
}