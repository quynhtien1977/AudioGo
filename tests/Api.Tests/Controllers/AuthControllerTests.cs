using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Server.Controllers;
using Server.Data;
using Server.Models;
using Server.Services;
using Server.Services.Interfaces;
using Moq;

namespace Api.Tests.Controllers;

/// <summary>
/// Tests cho AuthController — tập trung vào:
/// 1. ForgotPassword: tránh user enumeration
/// 2. ResetPassword: token hết hạn, token sai, token dùng được
/// 3. ChangePassword: sai mật khẩu cũ, đúng mật khẩu cũ
/// </summary>
public class AuthControllerTests
{
    // ── Helpers ────────────────────────────────────────────────────────────

    private static AppDbContext CreateDb(string name)
    {
        var opts = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(name)
            .Options;
        return new AppDbContext(opts);
    }

    private static AuthController CreateController(AppDbContext db, IWebHostEnvironment? env = null)
    {
        var emailMock = new Mock<IEmailService>();
        emailMock.Setup(e => e.SendPasswordResetEmailAsync(
            It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync(true);

        var configMock = new Mock<IConfiguration>();
        configMock.Setup(c => c["EmailSettings:CmsBaseUrl"]).Returns("http://localhost:5173");

        var envMock = env ?? Mock.Of<IWebHostEnvironment>(e =>
            e.EnvironmentName == "Development");

        // AuthService cần config và db
        var jwtConfig = new Mock<IConfiguration>();
        jwtConfig.Setup(c => c["Jwt:Key"]).Returns("supersecretkey1234567890abcdef123456");
        jwtConfig.Setup(c => c["Jwt:Issuer"]).Returns("test");
        jwtConfig.Setup(c => c["Jwt:Audience"]).Returns("test");

        var authService = new AuthService(db, jwtConfig.Object);
        var authMgmtLogger = new Mock<ILogger<AuthManagementService>>();
        var authMgmtService = new AuthManagementService(db, emailMock.Object, configMock.Object, authMgmtLogger.Object);
        var logger = new Mock<ILogger<AuthController>>();

        return new AuthController(authService, authMgmtService, db, envMock, logger.Object);
    }

    private static Account MakeAccount(string email, string? resetToken = null, DateTime? tokenExpiry = null)
    {
        return new Account
        {
            AccountId              = Guid.NewGuid().ToString(),
            Username               = "testuser",
            Email                  = email,
            PasswordHash           = BCrypt.Net.BCrypt.HashPassword("OldPass@123"),
            Role                   = "Owner",
            SubscriptionPlanId     = "basic",
            PasswordResetToken     = resetToken,
            PasswordResetTokenExpireAt = tokenExpiry
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ForgotPassword — anti-enumeration
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task ForgotPassword_ReturnsOk_EvenWhenEmailNotFound()
    {
        // Không được trả 404 khi email không tồn tại — tránh email enumeration
        await using var db = CreateDb(nameof(ForgotPassword_ReturnsOk_EvenWhenEmailNotFound));
        var controller = CreateController(db);

        var result = await controller.ForgotPassword(
            new Shared.DTOs.ForgotPasswordRequest("nonexistent@test.com"));

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task ForgotPassword_ReturnsOk_WhenEmailExists_AndSetsToken()
    {
        await using var db = CreateDb(nameof(ForgotPassword_ReturnsOk_WhenEmailExists_AndSetsToken));
        var acc = MakeAccount("real@test.com");
        db.Accounts.Add(acc);
        await db.SaveChangesAsync();

        var controller = CreateController(db);

        var result = await controller.ForgotPassword(
            new Shared.DTOs.ForgotPasswordRequest("real@test.com"));

        Assert.IsType<OkObjectResult>(result);

        // Token phải được ghi vào DB
        var updated = await db.Accounts.FindAsync(acc.AccountId);
        Assert.NotNull(updated!.PasswordResetToken);
        Assert.NotNull(updated.PasswordResetTokenExpireAt);
        Assert.True(updated.PasswordResetTokenExpireAt > DateTime.UtcNow);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ResetPassword
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task ResetPassword_ReturnsBadRequest_WhenTokenInvalid()
    {
        await using var db = CreateDb(nameof(ResetPassword_ReturnsBadRequest_WhenTokenInvalid));
        var controller = CreateController(db);

        var result = await controller.ResetPassword(
            new Shared.DTOs.ResetPasswordRequest("invalidtoken123", "NewPass@123"));

        var bad = Assert.IsType<BadRequestObjectResult>(result);
        Assert.Contains("Token", bad.Value?.ToString());
    }

    [Fact]
    public async Task ResetPassword_ReturnsBadRequest_WhenTokenExpired()
    {
        await using var db = CreateDb(nameof(ResetPassword_ReturnsBadRequest_WhenTokenExpired));

        var acc = MakeAccount("user@test.com",
            resetToken: "expiredtoken",
            tokenExpiry: DateTime.UtcNow.AddMinutes(-1)); // hết hạn 1 phút trước
        db.Accounts.Add(acc);
        await db.SaveChangesAsync();

        var controller = CreateController(db);

        var result = await controller.ResetPassword(
            new Shared.DTOs.ResetPasswordRequest("expiredtoken", "NewPass@123"));

        var bad = Assert.IsType<BadRequestObjectResult>(result);
        Assert.Contains("hết hạn", bad.Value?.ToString());
    }

    [Fact]
    public async Task ResetPassword_ReturnsOk_AndClearsToken_WhenValid()
    {
        await using var db = CreateDb(nameof(ResetPassword_ReturnsOk_AndClearsToken_WhenValid));

        var acc = MakeAccount("user@test.com",
            resetToken: "validtoken123abc",
            tokenExpiry: DateTime.UtcNow.AddMinutes(30));
        db.Accounts.Add(acc);
        await db.SaveChangesAsync();

        var controller = CreateController(db);

        var result = await controller.ResetPassword(
            new Shared.DTOs.ResetPasswordRequest("validtoken123abc", "NewSecure@456"));

        Assert.IsType<OkObjectResult>(result);

        // Token phải được xóa sau khi dùng
        var updated = await db.Accounts.FindAsync(acc.AccountId);
        Assert.Null(updated!.PasswordResetToken);
        Assert.Null(updated.PasswordResetTokenExpireAt);
        Assert.False(updated.MustChangePassword);
    }

    [Fact]
    public async Task ResetPassword_ReturnsBadRequest_WhenPasswordTooWeak()
    {
        await using var db = CreateDb(nameof(ResetPassword_ReturnsBadRequest_WhenPasswordTooWeak));

        var acc = MakeAccount("user@test.com",
            resetToken: "goodtoken",
            tokenExpiry: DateTime.UtcNow.AddMinutes(30));
        db.Accounts.Add(acc);
        await db.SaveChangesAsync();

        var controller = CreateController(db);

        var result = await controller.ResetPassword(
            new Shared.DTOs.ResetPasswordRequest("goodtoken", "weak"));

        Assert.IsType<BadRequestObjectResult>(result);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Setup-dev — chỉ chạy trong Development
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task SetupDev_ReturnsNotFound_InProductionEnvironment()
    {
        await using var db = CreateDb(nameof(SetupDev_ReturnsNotFound_InProductionEnvironment));

        var prodEnv = Mock.Of<IWebHostEnvironment>(e =>
            e.EnvironmentName == "Production");

        var controller = CreateController(db, prodEnv);

        var result = await controller.SetupDev(
            new Shared.DTOs.LoginRequest("admin", "Admin@123"));

        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public async Task SetupDev_ReturnsOk_InDevelopmentEnvironment()
    {
        await using var db = CreateDb(nameof(SetupDev_ReturnsOk_InDevelopmentEnvironment));

        var devEnv = Mock.Of<IWebHostEnvironment>(e =>
            e.EnvironmentName == "Development");

        var controller = CreateController(db, devEnv);

        var result = await controller.SetupDev(
            new Shared.DTOs.LoginRequest("devadmin", "Admin@123"));

        Assert.IsType<OkObjectResult>(result);
    }
}
