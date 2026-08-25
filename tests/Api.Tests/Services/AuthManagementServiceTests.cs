using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using Server.Data;
using Server.Models;
using Server.Services;
using Server.Services.Interfaces;
using Xunit;

namespace Api.Tests.Services;

public class AuthManagementServiceTests
{
    private static AppDbContext CreateDb(string name)
    {
        var opts = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(name)
            .Options;
        return new AppDbContext(opts);
    }

    private static (AuthManagementService service, Mock<IEmailService> emailMock) CreateService(AppDbContext db)
    {
        var emailMock = new Mock<IEmailService>();
        emailMock.Setup(e => e.SendPasswordResetEmailAsync(
            It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync(true);

        var configMock = new Mock<IConfiguration>();
        configMock.Setup(c => c["EmailSettings:CmsBaseUrl"]).Returns("http://localhost:5173");

        var loggerMock = new Mock<ILogger<AuthManagementService>>();

        var service = new AuthManagementService(db, emailMock.Object, configMock.Object, loggerMock.Object);
        return (service, emailMock);
    }

    [Fact]
    public async Task SendPasswordResetEmailAsync_WhenEmailExists_GeneratesTokenAndSendsEmail()
    {
        using var db = CreateDb(nameof(SendPasswordResetEmailAsync_WhenEmailExists_GeneratesTokenAndSendsEmail));
        var account = new Account
        {
            AccountId = "acc-1",
            Username = "user1",
            Email = "user1@example.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Pass@123"),
            CreatedAt = DateTime.UtcNow
        };
        db.Accounts.Add(account);
        await db.SaveChangesAsync();

        var (service, emailMock) = CreateService(db);

        var result = await service.SendPasswordResetEmailAsync("user1@example.com");

        Assert.True(result);
        var updated = await db.Accounts.FindAsync("acc-1");
        Assert.NotNull(updated?.PasswordResetToken);
        Assert.True(updated?.PasswordResetTokenExpireAt > DateTime.UtcNow);
        emailMock.Verify(e => e.SendPasswordResetEmailAsync(
            "user1@example.com",
            It.IsAny<string>(),
            It.Is<string>(url => url.Contains("/reset-password?token="))), Times.Once);
    }

    [Fact]
    public async Task SendPasswordResetEmailAsync_WhenEmailNotFound_ReturnsFalseWithoutEmail()
    {
        using var db = CreateDb(nameof(SendPasswordResetEmailAsync_WhenEmailNotFound_ReturnsFalseWithoutEmail));
        var (service, emailMock) = CreateService(db);

        var result = await service.SendPasswordResetEmailAsync("nonexistent@example.com");

        Assert.False(result);
        emailMock.Verify(e => e.SendPasswordResetEmailAsync(
            It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task ResetPasswordAsync_ValidToken_UpdatesPasswordAndClearsToken()
    {
        using var db = CreateDb(nameof(ResetPasswordAsync_ValidToken_UpdatesPasswordAndClearsToken));
        var account = new Account
        {
            AccountId = "acc-2",
            Username = "user2",
            Email = "user2@example.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("OldPass@123"),
            PasswordResetToken = "valid-token-123",
            PasswordResetTokenExpireAt = DateTime.UtcNow.AddMinutes(15),
            CreatedAt = DateTime.UtcNow
        };
        db.Accounts.Add(account);
        await db.SaveChangesAsync();

        var (service, _) = CreateService(db);

        var (success, error) = await service.ResetPasswordAsync("valid-token-123", "NewSecretPass@123");

        Assert.True(success);
        Assert.Null(error);

        var updated = await db.Accounts.FindAsync("acc-2");
        Assert.Null(updated?.PasswordResetToken);
        Assert.Null(updated?.PasswordResetTokenExpireAt);
        Assert.True(BCrypt.Net.BCrypt.Verify("NewSecretPass@123", updated?.PasswordHash));
    }

    [Fact]
    public async Task ResetPasswordAsync_ExpiredToken_Fails()
    {
        using var db = CreateDb(nameof(ResetPasswordAsync_ExpiredToken_Fails));
        var account = new Account
        {
            AccountId = "acc-3",
            Username = "user3",
            Email = "user3@example.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("OldPass@123"),
            PasswordResetToken = "expired-token",
            PasswordResetTokenExpireAt = DateTime.UtcNow.AddMinutes(-5),
            CreatedAt = DateTime.UtcNow
        };
        db.Accounts.Add(account);
        await db.SaveChangesAsync();

        var (service, _) = CreateService(db);

        var (success, error) = await service.ResetPasswordAsync("expired-token", "NewSecretPass@123");

        Assert.False(success);
        Assert.Contains("hết hạn", error);
    }

    [Fact]
    public async Task ChangePasswordAsync_ValidOldPassword_UpdatesPassword()
    {
        using var db = CreateDb(nameof(ChangePasswordAsync_ValidOldPassword_UpdatesPassword));
        var account = new Account
        {
            AccountId = "acc-4",
            Username = "user4",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("CurrentPass@123"),
            CreatedAt = DateTime.UtcNow
        };
        db.Accounts.Add(account);
        await db.SaveChangesAsync();

        var (service, _) = CreateService(db);

        var (success, error) = await service.ChangePasswordAsync("acc-4", "CurrentPass@123", "BrandNewPass@456");

        Assert.True(success);
        Assert.Null(error);

        var updated = await db.Accounts.FindAsync("acc-4");
        Assert.True(BCrypt.Net.BCrypt.Verify("BrandNewPass@456", updated?.PasswordHash));
    }

    [Fact]
    public async Task ChangePasswordAsync_InvalidOldPassword_Fails()
    {
        using var db = CreateDb(nameof(ChangePasswordAsync_InvalidOldPassword_Fails));
        var account = new Account
        {
            AccountId = "acc-5",
            Username = "user5",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("CurrentPass@123"),
            CreatedAt = DateTime.UtcNow
        };
        db.Accounts.Add(account);
        await db.SaveChangesAsync();

        var (service, _) = CreateService(db);

        var (success, error) = await service.ChangePasswordAsync("acc-5", "WrongOldPass", "BrandNewPass@456");

        Assert.False(success);
        Assert.Contains("Mật khẩu cũ không đúng", error);
    }

    [Fact]
    public async Task GetAccountProfileAsync_ExistingAccount_ReturnsDto()
    {
        using var db = CreateDb(nameof(GetAccountProfileAsync_ExistingAccount_ReturnsDto));
        var account = new Account
        {
            AccountId = "acc-6",
            Username = "user6",
            FullName = "User Six",
            Email = "six@example.com",
            Role = "Owner",
            CreatedAt = DateTime.UtcNow
        };
        db.Accounts.Add(account);
        await db.SaveChangesAsync();

        var (service, _) = CreateService(db);

        var profile = await service.GetAccountProfileAsync("acc-6");

        Assert.NotNull(profile);
        Assert.Equal("user6", profile?.Username);
        Assert.Equal("User Six", profile?.FullName);
        Assert.Equal("six@example.com", profile?.Email);
    }
}
