using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Moq;
using Server.Data;
using Server.Models;
using Server.Services;
using Server.Services.Interfaces;
using Shared.DTOs;
using System.Text.Json;
using Xunit;

namespace Api.Tests.Services;

public class LandingServiceTests
{
    private static AppDbContext CreateDb(string name)
    {
        var opts = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(name)
            .Options;
        return new AppDbContext(opts);
    }

    private static (LandingService service, Mock<IBlobStorageService> blobMock, Mock<IEmailService> emailMock) CreateService(AppDbContext db)
    {
        var blobMock = new Mock<IBlobStorageService>();
        var emailMock = new Mock<IEmailService>();
        var configMock = new Mock<IConfiguration>();
        configMock.Setup(c => c["ADMIN_CONTACT_EMAIL"]).Returns("admin@audiogo.vn");

        var service = new LandingService(db, blobMock.Object, emailMock.Object, configMock.Object);
        return (service, blobMock, emailMock);
    }

    [Fact]
    public async Task GetAllSectionsAsync_ReturnsOrderedSections()
    {
        using var db = CreateDb(nameof(GetAllSectionsAsync_ReturnsOrderedSections));
        db.LandingSections.AddRange(
            new LandingSection { SectionId = "s2", SectionKey = "features", SortOrder = 2, IsActive = true, ContentJson = "{}" },
            new LandingSection { SectionId = "s1", SectionKey = "hero", SortOrder = 1, IsActive = true, ContentJson = "{}" }
        );
        await db.SaveChangesAsync();

        var (service, _, _) = CreateService(db);

        var sections = await service.GetAllSectionsAsync();

        Assert.Equal(2, sections.Count);
        Assert.Equal("s1", sections[0].SectionId);
        Assert.Equal("s2", sections[1].SectionId);
    }

    [Fact]
    public async Task UpdateSectionMetaAsync_UpdatesIsActiveAndSortOrder()
    {
        using var db = CreateDb(nameof(UpdateSectionMetaAsync_UpdatesIsActiveAndSortOrder));
        db.LandingSections.Add(new LandingSection
        {
            SectionId = "s1",
            SectionKey = "hero",
            SortOrder = 1,
            IsActive = true,
            ContentJson = "{}"
        });
        await db.SaveChangesAsync();

        var (service, _, _) = CreateService(db);

        var result = await service.UpdateSectionMetaAsync("s1", false, 5, "acc-admin");

        Assert.True(result);
        var updated = await db.LandingSections.FindAsync("s1");
        Assert.False(updated?.IsActive);
        Assert.Equal(5, updated?.SortOrder);
        Assert.Equal("acc-admin", updated?.UpdatedByAccountId);
    }

    [Fact]
    public async Task GetPublicLandingAsync_MergesTranslationsWithFallback()
    {
        using var db = CreateDb(nameof(GetPublicLandingAsync_MergesTranslationsWithFallback));
        var contentJson = """
        {
            "shared": { "imageUrl": "https://example.com/hero.jpg" },
            "translations": {
                "vi": { "title": "Khám phá ẩm thực" },
                "en": { "title": "Explore street food" }
            }
        }
        """;

        db.LandingSections.Add(new LandingSection
        {
            SectionId = "hero",
            SectionKey = "hero",
            SortOrder = 1,
            IsActive = true,
            ContentJson = contentJson
        });
        await db.SaveChangesAsync();

        var (service, _, _) = CreateService(db);

        var jsonOptions = new JsonSerializerOptions
        {
            Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
        };

        // 1. Request tiếng Anh
        var enResult = await service.GetPublicLandingAsync("en");
        Assert.Single(enResult);
        var enJson = JsonSerializer.Serialize(enResult[0], jsonOptions);
        Assert.Contains("Explore street food", enJson);
        Assert.Contains("https://example.com/hero.jpg", enJson);

        // 2. Request tiếng chưa có (es) -> fallback về "vi"
        var esResult = await service.GetPublicLandingAsync("es");
        Assert.Single(esResult);
        var esJson = JsonSerializer.Serialize(esResult[0], jsonOptions);
        Assert.Contains("Khám phá ẩm thực", esJson);
    }

    [Fact]
    public async Task GetLatestAppAsync_ReturnsActiveLatestRelease()
    {
        using var db = CreateDb(nameof(GetLatestAppAsync_ReturnsActiveLatestRelease));
        db.AppReleases.AddRange(
            new AppRelease
            {
                ReleaseId = "rel-1",
                Version = "1.0.0",
                ApkUrl = "https://example.com/1.0.0.apk",
                FileSizeBytes = 15_000_000,
                IsLatest = false,
                CreatedAt = DateTime.UtcNow.AddDays(-10)
            },
            new AppRelease
            {
                ReleaseId = "rel-2",
                Version = "1.1.0",
                ApkUrl = "https://example.com/1.1.0.apk",
                FileSizeBytes = 16_000_000,
                IsLatest = true,
                CreatedAt = DateTime.UtcNow
            }
        );
        await db.SaveChangesAsync();

        var (service, _, _) = CreateService(db);

        var latest = await service.GetLatestAppAsync();

        Assert.NotNull(latest);
        Assert.Equal("1.1.0", latest?.Version);
        Assert.Equal("https://example.com/1.1.0.apk", latest?.ApkUrl);
    }

    [Fact]
    public async Task SubmitConsultationAsync_ValidRequest_SavesToDbAndSendsEmail()
    {
        using var db = CreateDb(nameof(SubmitConsultationAsync_ValidRequest_SavesToDbAndSendsEmail));
        var (service, _, emailMock) = CreateService(db);

        var req = new ConsultationFormDto(
            FullName: "Nguyễn Văn A",
            RestaurantName: "Quán Ăn Ngon",
            PhoneNumber: "0901234567",
            Area: "Quận 4",
            Email: "nguyenvana@gmail.com",
            Message: "Tư vấn giúp tôi gói cơ bản"
        );

        var (success, error) = await service.SubmitConsultationAsync(req);

        Assert.True(success);
        Assert.Null(error);

        var saved = await db.ConsultationRequests.FirstOrDefaultAsync(c => c.Email == "nguyenvana@gmail.com");
        Assert.NotNull(saved);
        Assert.Equal("0901234567", saved?.PhoneNumber);
        Assert.Equal("New", saved?.Status);

        emailMock.Verify(e => e.SendConsultationNotificationAsync(
            "admin@audiogo.vn",
            "Nguyễn Văn A",
            "Quán Ăn Ngon",
            "0901234567",
            "nguyenvana@gmail.com",
            "Quận 4",
            "Tư vấn giúp tôi gói cơ bản"), Times.Once);
    }

    [Fact]
    public async Task SubmitConsultationAsync_InvalidPhoneOrEmail_Fails()
    {
        using var db = CreateDb(nameof(SubmitConsultationAsync_InvalidPhoneOrEmail_Fails));
        var (service, _, _) = CreateService(db);

        // Email sai định dạng
        var invalidEmailReq = new ConsultationFormDto("Test", "Quán", "0901234567", "Q4", "invalid-email", "msg");
        var (success1, error1) = await service.SubmitConsultationAsync(invalidEmailReq);
        Assert.False(success1);
        Assert.Contains("Email không hợp lệ", error1);

        // SĐT không hợp lệ (không bắt đầu bằng 0 hoặc không đủ 10 số)
        var invalidPhoneReq = new ConsultationFormDto("Test", "Quán", "12345", "Q4", "test@gmail.com", "msg");
        var (success2, error2) = await service.SubmitConsultationAsync(invalidPhoneReq);
        Assert.False(success2);
        Assert.Contains("Số điện thoại không hợp lệ", error2);
    }
}
