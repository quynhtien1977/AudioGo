using Microsoft.AspNetCore.Mvc;
using Moq;
using Server.Controllers.Cms;
using Server.Models;
using Server.Repositories.Interfaces;
using Server.Services.Interfaces;
using Shared.DTOs;

namespace Api.Tests.Controllers;

/// <summary>
/// Unit tests cho CmsAccountController — tập trung vào:
/// 1. Check email unique khi tạo account
/// 2. Check email unique khi sửa profile
/// 3. Check username unique khi tạo account
/// </summary>
public class CmsAccountControllerTests
{
    // ── Helpers ────────────────────────────────────────────────────────────

    /// <summary>Tạo mock IAccountRepository với email và username check có thể cấu hình</summary>
    private static Mock<IAccountRepository> MockRepo(
        bool emailExists = false,
        bool usernameExists = false,
        string? emailExcludeId = null)
    {
        var mock = new Mock<IAccountRepository>();

        mock.Setup(r => r.ExistsByUsernameAsync(It.IsAny<string>()))
            .ReturnsAsync(usernameExists);

        // ExistsByEmailAsync với excludeAccountId
        mock.Setup(r => r.ExistsByEmailAsync(It.IsAny<string>(), null))
            .ReturnsAsync(emailExists);

        mock.Setup(r => r.ExistsByEmailAsync(It.IsAny<string>(), It.IsNotNull<string>()))
            .ReturnsAsync((string email, string? excl) =>
                emailExists && excl != emailExcludeId);

        mock.Setup(r => r.CreateAsync(It.IsAny<Account>()))
            .ReturnsAsync((Account a) => a);

        mock.Setup(r => r.GetByIdAsync(It.IsAny<string>()))
            .ReturnsAsync(new Account
            {
                AccountId    = "user-id-1",
                Username     = "existinguser",
                Email        = "old@test.com",
                PasswordHash = "hash",
                Role         = "Owner",
                SubscriptionPlanId = "basic"
            });

        mock.Setup(r => r.UpdateAsync(It.IsAny<Account>()))
            .ReturnsAsync((Account a) => a);

        return mock;
    }

    private static CmsAccountController CreateController(Mock<IAccountRepository> repo)
    {
        var emailMock = new Mock<IEmailService>();
        emailMock.Setup(e => e.SendAccountCreatedEmailAsync(
            It.IsAny<string>(), It.IsAny<string>(),
            It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string?>()))
            .ReturnsAsync(true);

        var controller = new CmsAccountController(repo.Object, emailMock.Object);

        // Fake JWT Claims — cần cho GetCurrentUserId()
        var claims = new System.Security.Claims.ClaimsPrincipal(
            new System.Security.Claims.ClaimsIdentity(
            [
                new System.Security.Claims.Claim(
                    System.Security.Claims.ClaimTypes.NameIdentifier, "user-id-1")
            ], "Test"));

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new Microsoft.AspNetCore.Http.DefaultHttpContext
            {
                User = claims
            }
        };

        return controller;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CREATE — Email unique check
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Create_ReturnsBadRequest_WhenEmailAlreadyExists()
    {
        var repo = MockRepo(emailExists: true, usernameExists: false);
        var controller = CreateController(repo);

        var req = new AccountCreateRequest
        {
            Username    = "newuser",
            FullName    = "New User",
            Email       = "taken@test.com",
            PhoneNumber = "0901234567",
            Role        = "Owner"
        };

        var result = await controller.Create(req);

        var bad = Assert.IsType<BadRequestObjectResult>(result);
        Assert.Contains("Email", bad.Value?.ToString());
    }

    [Fact]
    public async Task Create_ReturnsBadRequest_WhenUsernameAlreadyExists()
    {
        var repo = MockRepo(emailExists: false, usernameExists: true);
        var controller = CreateController(repo);

        var req = new AccountCreateRequest
        {
            Username    = "existinguser",
            FullName    = "Some User",
            Email       = "fresh@test.com",
            PhoneNumber = "0901234567",
            Role        = "Owner"
        };

        var result = await controller.Create(req);

        var bad = Assert.IsType<BadRequestObjectResult>(result);
        Assert.Contains("Username", bad.Value?.ToString());
    }

    [Fact]
    public async Task Create_Returns201_WhenEmailAndUsernameAreUnique()
    {
        var repo = MockRepo(emailExists: false, usernameExists: false);
        var controller = CreateController(repo);

        var req = new AccountCreateRequest
        {
            Username    = "brandnew",
            FullName    = "Brand New",
            Email       = "unique@test.com",
            PhoneNumber = "0901234567",
            Role        = "Owner"
        };

        var result = await controller.Create(req);

        Assert.IsType<CreatedAtActionResult>(result);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UPDATE MY PROFILE — Email unique check với self-exclude
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task UpdateMyProfile_ReturnsBadRequest_WhenEmailTakenByOther()
    {
        // email tồn tại bởi account khác (không phải user-id-1)
        var repo = MockRepo(emailExists: true, emailExcludeId: "OTHER-ID");
        var controller = CreateController(repo);

        var req = new ProfileUpdateRequest("Me", "stolen@test.com", "0901234567");

        var result = await controller.UpdateMyProfile(req);

        // UpdateMyProfile trả về ActionResult<AccountDto> — unwrap để kiểm tra
        var actionResult = Assert.IsAssignableFrom<Microsoft.AspNetCore.Mvc.ActionResult<Shared.DTOs.AccountDto>>(result);
        Assert.IsType<BadRequestObjectResult>(actionResult.Result);
    }

    [Fact]
    public async Task UpdateMyProfile_ReturnsOk_WhenEmailBelongsToSelf()
    {
        // email tồn tại nhưng là của chính user-id-1 (self-exclude)
        var mock = new Mock<IAccountRepository>();
        mock.Setup(r => r.ExistsByEmailAsync("me@test.com", "user-id-1"))
            .ReturnsAsync(false); // chính mình → không coi là trùng

        mock.Setup(r => r.GetByIdAsync("user-id-1"))
            .ReturnsAsync(new Account
            {
                AccountId          = "user-id-1",
                Username           = "myuser",
                Email              = "me@test.com",
                PasswordHash       = "hash",
                Role               = "Owner",
                SubscriptionPlanId = "basic"
            });

        mock.Setup(r => r.UpdateAsync(It.IsAny<Account>()))
            .ReturnsAsync((Account a) => a);

        var controller = CreateController(mock);

        var req = new ProfileUpdateRequest("Me", "me@test.com", "0901234567"); // giữ nguyên email cũ

        var result = await controller.UpdateMyProfile(req);

        // UpdateMyProfile trả về ActionResult<AccountDto> — unwrap để kiểm tra
        var actionResult = Assert.IsAssignableFrom<Microsoft.AspNetCore.Mvc.ActionResult<Shared.DTOs.AccountDto>>(result);
        Assert.IsType<OkObjectResult>(actionResult.Result);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Validation — Backend email format check
    // ─────────────────────────────────────────────────────────────────────────

    [Theory]
    [InlineData("notanemail")]
    [InlineData("missing@")]
    [InlineData("@nodomain.com")]
    public async Task Create_ReturnsBadRequest_WhenEmailFormatInvalid(string badEmail)
    {
        var repo = MockRepo(emailExists: false, usernameExists: false);
        var controller = CreateController(repo);

        var req = new AccountCreateRequest
        {
            Username    = "testuser",
            FullName    = "Test",
            Email       = badEmail,
            PhoneNumber = "0901234567",
            Role        = "Owner"
        };

        var result = await controller.Create(req);

        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Theory]
    [InlineData("012345678")]      // 9 số
    [InlineData("01234567890")]    // 11 số
    [InlineData("1901234567")]     // không bắt đầu 0x
    public async Task Create_ReturnsBadRequest_WhenPhoneInvalid(string badPhone)
    {
        var repo = MockRepo(emailExists: false, usernameExists: false);
        var controller = CreateController(repo);

        var req = new AccountCreateRequest
        {
            Username    = "testuser",
            FullName    = "Test",
            Email       = "valid@test.com",
            PhoneNumber = badPhone,
            Role        = "Owner"
        };

        var result = await controller.Create(req);

        Assert.IsType<BadRequestObjectResult>(result);
    }
}
