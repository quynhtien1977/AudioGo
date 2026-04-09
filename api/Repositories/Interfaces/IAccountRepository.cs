
using Server.Models;

namespace Server.Repositories.Interfaces
{
    public interface IAccountRepository
    {
        // GET
        Task<List<Account>> GetAllAsync();
        Task<Account?> GetByIdAsync(string id);

        // CREATE
        Task<Account> CreateAsync(Account account);

        // UPDATE FULL
        Task<Account> UpdateAsync(Account account);

        // DELETE
        Task<bool> DeleteAsync(string id);

        // 🔥 NEW - KHÔNG ẢNH HƯỞNG CODE CŨ

        // Lock / Unlock account
        Task<bool> SetLockStatusAsync(string id, bool isLocked);

        // Update role riêng (dùng cho admin)
        Task<bool> UpdateRoleAsync(string id, string role);

        // Check username tồn tại (tránh trùng)
        Task<bool> ExistsByUsernameAsync(string username);
    }
}