using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories;

namespace Api.Tests.Repositories;

/// <summary>
/// Tests cho AccountRepository — đặc biệt ExistsByEmailAsync và ExistsByUsernameAsync
/// </summary>
public class AccountRepositoryTests
{
    // ── Helper: tạo in-memory DB context mới cho mỗi test ─────────────────
    private static AppDbContext CreateDb(string dbName)
    {
        var opts = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;
        return new AppDbContext(opts);
    }

    private static Account MakeAccount(string id, string username, string email, bool deleted = false) =>
        new Account
        {
            AccountId    = id,
            Username     = username,
            Email        = email,
            PasswordHash = "hash",
            Role         = "Owner",
            SubscriptionPlanId = "basic",
            DeletedAt    = deleted ? DateTime.UtcNow : null
        };

    // ─────────────────────────────────────────────────────────────────────────
    // ExistsByEmailAsync
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task ExistsByEmailAsync_ReturnsFalse_WhenNoAccountHasEmail()
    {
        await using var db = CreateDb(nameof(ExistsByEmailAsync_ReturnsFalse_WhenNoAccountHasEmail));
        var repo = new AccountRepository(db);

        var result = await repo.ExistsByEmailAsync("nobody@test.com");

        Assert.False(result);
    }

    [Fact]
    public async Task ExistsByEmailAsync_ReturnsTrue_WhenEmailExists()
    {
        await using var db = CreateDb(nameof(ExistsByEmailAsync_ReturnsTrue_WhenEmailExists));
        db.Accounts.Add(MakeAccount("id1", "user1", "taken@test.com"));
        await db.SaveChangesAsync();
        var repo = new AccountRepository(db);

        var result = await repo.ExistsByEmailAsync("taken@test.com");

        Assert.True(result);
    }

    [Fact]
    public async Task ExistsByEmailAsync_ReturnsFalse_WhenAccountIsSoftDeleted()
    {
        await using var db = CreateDb(nameof(ExistsByEmailAsync_ReturnsFalse_WhenAccountIsSoftDeleted));
        db.Accounts.Add(MakeAccount("id1", "user1", "deleted@test.com", deleted: true));
        await db.SaveChangesAsync();
        var repo = new AccountRepository(db);

        // Tài khoản đã bị xóa → không coi là "đang dùng email"
        var result = await repo.ExistsByEmailAsync("deleted@test.com");

        Assert.False(result);
    }

    [Fact]
    public async Task ExistsByEmailAsync_ReturnsFalse_WhenExcludingSameAccount()
    {
        await using var db = CreateDb(nameof(ExistsByEmailAsync_ReturnsFalse_WhenExcludingSameAccount));
        db.Accounts.Add(MakeAccount("id1", "user1", "me@test.com"));
        await db.SaveChangesAsync();
        var repo = new AccountRepository(db);

        // User đang sửa profile của chính mình → không bị báo trùng
        var result = await repo.ExistsByEmailAsync("me@test.com", excludeAccountId: "id1");

        Assert.False(result);
    }

    [Fact]
    public async Task ExistsByEmailAsync_ReturnsTrue_WhenOtherAccountHasSameEmail()
    {
        await using var db = CreateDb(nameof(ExistsByEmailAsync_ReturnsTrue_WhenOtherAccountHasSameEmail));
        db.Accounts.Add(MakeAccount("id1", "user1", "shared@test.com"));
        db.Accounts.Add(MakeAccount("id2", "user2", "other@test.com"));
        await db.SaveChangesAsync();
        var repo = new AccountRepository(db);

        // user2 đang sửa email, nhưng "shared@test.com" đã thuộc user1
        var result = await repo.ExistsByEmailAsync("shared@test.com", excludeAccountId: "id2");

        Assert.True(result);
    }

    [Fact]
    public async Task ExistsByEmailAsync_ReturnsFalse_ForEmptyEmail()
    {
        await using var db = CreateDb(nameof(ExistsByEmailAsync_ReturnsFalse_ForEmptyEmail));
        var repo = new AccountRepository(db);

        Assert.False(await repo.ExistsByEmailAsync(""));
        Assert.False(await repo.ExistsByEmailAsync("   "));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ExistsByUsernameAsync — đảm bảo soft-delete fix hoạt động
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task ExistsByUsernameAsync_ReturnsFalse_WhenUserIsSoftDeleted()
    {
        await using var db = CreateDb(nameof(ExistsByUsernameAsync_ReturnsFalse_WhenUserIsSoftDeleted));
        db.Accounts.Add(MakeAccount("id1", "deleteduser", "x@x.com", deleted: true));
        await db.SaveChangesAsync();
        var repo = new AccountRepository(db);

        // Username bị xóa mềm không coi là "đang tồn tại"
        var result = await repo.ExistsByUsernameAsync("deleteduser");

        Assert.False(result);
    }

    [Fact]
    public async Task ExistsByUsernameAsync_ReturnsTrue_WhenUsernameActive()
    {
        await using var db = CreateDb(nameof(ExistsByUsernameAsync_ReturnsTrue_WhenUsernameActive));
        db.Accounts.Add(MakeAccount("id1", "activeuser", "x@x.com"));
        await db.SaveChangesAsync();
        var repo = new AccountRepository(db);

        var result = await repo.ExistsByUsernameAsync("activeuser");

        Assert.True(result);
    }
}
