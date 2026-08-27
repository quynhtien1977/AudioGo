using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Services;
using Shared.DTOs;

namespace Api.Tests.Services;

public class CrudServicesTests
{
    private AppDbContext CreateInMemoryDb(string name)
    {
        var opts = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(name)
            .Options;
        return new AppDbContext(opts);
    }

    // ═══════════════════════════════════════════════════════════
    // PoiContentService Tests
    // ═══════════════════════════════════════════════════════════

    [Fact]
    public async Task PoiContent_GetAll_ReturnsOnlyMatchingPoiId()
    {
        await using var db = CreateInMemoryDb(nameof(PoiContent_GetAll_ReturnsOnlyMatchingPoiId));
        db.PoiContents.AddRange(
            new PoiContent { ContentId = "c1", PoiId = "poi-A", LanguageCode = "vi", Title = "A", Description = "D", AudioUrl = "", IsMaster = true },
            new PoiContent { ContentId = "c2", PoiId = "poi-B", LanguageCode = "vi", Title = "B", Description = "D", AudioUrl = "", IsMaster = true }
        );
        await db.SaveChangesAsync();

        var svc = new PoiContentService(db);
        var result = await svc.GetAllAsync("poi-A");

        Assert.Single(result);
        Assert.Equal("c1", result[0].ContentId);
    }

    [Fact]
    public async Task PoiContent_Create_SavesAndReturnsDto()
    {
        await using var db = CreateInMemoryDb(nameof(PoiContent_Create_SavesAndReturnsDto));
        var svc = new PoiContentService(db);

        var req = new PoiContentCreateRequest("vi", "Tiêu đề", "Mô tả", "http://audio.mp3", true);
        var dto = await svc.CreateAsync("poi-X", req);

        Assert.NotNull(dto.ContentId);
        Assert.Equal("poi-X", dto.PoiId);
        Assert.Equal("Tiêu đề", dto.Title);
    }

    [Fact]
    public async Task PoiContent_UpdateMaster_TitleOnly_SyncsSlaveTitles_KeepsSlaves()
    {
        await using var db = CreateInMemoryDb(nameof(PoiContent_UpdateMaster_TitleOnly_SyncsSlaveTitles_KeepsSlaves));
        db.PoiContents.AddRange(
            new PoiContent { ContentId = "master",   PoiId = "poi-1", LanguageCode = "vi", Title = "Old",    Description = "Cũ", AudioUrl = "a.mp3", IsMaster = true  },
            new PoiContent { ContentId = "slave-en", PoiId = "poi-1", LanguageCode = "en", Title = "Old EN", Description = "Old", AudioUrl = "b.mp3", IsMaster = false }
        );
        await db.SaveChangesAsync();

        var svc = new PoiContentService(db);
        // Chỉ đổi Title, Description = null
        var req = new PoiContentUpdateRequest("Mới", null, null, null);
        await svc.UpdateAsync("poi-1", "master", req);

        var all = db.PoiContents.ToList();
        Assert.Equal(2, all.Count); // slave KHÔNG bị xóa

        var slave = all.First(c => !c.IsMaster);
        Assert.Equal("Mới", slave.Title);          // title slave được sync
        Assert.Equal("Old", slave.Description);     // description slave giữ nguyên
        Assert.Equal("b.mp3", slave.AudioUrl);      // audio slave giữ nguyên

        var master = all.First(c => c.IsMaster);
        Assert.Equal("a.mp3", master.AudioUrl);     // audio master giữ nguyên (description không đổi)
    }

    [Fact]
    public async Task PoiContent_UpdateMaster_DescriptionChanged_DeletesSlavesAndClearsMasterAudio()
    {
        await using var db = CreateInMemoryDb(nameof(PoiContent_UpdateMaster_DescriptionChanged_DeletesSlavesAndClearsMasterAudio));
        db.PoiContents.AddRange(
            new PoiContent { ContentId = "master",   PoiId = "poi-1", LanguageCode = "vi", Title = "Old", Description = "Cũ",    AudioUrl = "a.mp3", IsMaster = true  },
            new PoiContent { ContentId = "slave-en", PoiId = "poi-1", LanguageCode = "en", Title = "Old", Description = "Old EN", AudioUrl = "b.mp3", IsMaster = false }
        );
        await db.SaveChangesAsync();

        var svc = new PoiContentService(db);
        // Đổi Description, không truyền AudioUrl (null → pipeline tự TTS lại)
        var req = new PoiContentUpdateRequest(null, "Mô tả mới", null, null);
        await svc.UpdateAsync("poi-1", "master", req);

        var remaining = db.PoiContents.ToList();
        Assert.Single(remaining);                            // slave bị xóa
        Assert.Equal("master", remaining[0].ContentId);

        var master = remaining[0];
        Assert.Equal("Mô tả mới", master.Description);
        Assert.Null(master.AudioUrl);                        // audio master bị clear → pipeline re-TTS
    }

    [Fact]
    public async Task PoiContent_Delete_NotFound_ThrowsKeyNotFound()
    {
        await using var db = CreateInMemoryDb(nameof(PoiContent_Delete_NotFound_ThrowsKeyNotFound));
        var svc = new PoiContentService(db);
        await Assert.ThrowsAsync<KeyNotFoundException>(() => svc.DeleteAsync("poi-X", "nonexistent"));
    }

    // ═══════════════════════════════════════════════════════════
    // PoiGalleryService Tests
    // ═══════════════════════════════════════════════════════════

    [Fact]
    public async Task PoiGallery_GetAll_OrderedBySortOrder()
    {
        await using var db = CreateInMemoryDb(nameof(PoiGallery_GetAll_OrderedBySortOrder));
        db.PoiGalleries.AddRange(
            new PoiGallery { ImageId = "img-2", PoiId = "poi-1", ImageUrl = "b.jpg", SortOrder = 2 },
            new PoiGallery { ImageId = "img-1", PoiId = "poi-1", ImageUrl = "a.jpg", SortOrder = 1 }
        );
        await db.SaveChangesAsync();

        var svc = new PoiGalleryService(db);
        var result = await svc.GetAllAsync("poi-1");

        Assert.Equal(2, result.Count);
        Assert.Equal("img-1", result[0].ImageId); // sort order 1 đứng đầu
    }

    [Fact]
    public async Task PoiGallery_Create_SavesAndReturnsDto()
    {
        await using var db = CreateInMemoryDb(nameof(PoiGallery_Create_SavesAndReturnsDto));
        var svc = new PoiGalleryService(db);

        var req = new PoiGalleryDto("", "poi-Y", "http://img.jpg", 0);
        var dto = await svc.CreateAsync("poi-Y", req);

        Assert.NotNull(dto.ImageId);
        Assert.Equal("poi-Y", dto.PoiId);
    }

    // ═══════════════════════════════════════════════════════════
    // ConsultationService Tests
    // ═══════════════════════════════════════════════════════════

    [Fact]
    public async Task Consultation_GetAll_FilterByStatus()
    {
        await using var db = CreateInMemoryDb(nameof(Consultation_GetAll_FilterByStatus));
        db.ConsultationRequests.AddRange(
            new ConsultationRequest { RequestId = "r1", FullName = "A", RestaurantName = "Quán A", PhoneNumber = "01", Status = "New",       CreatedAt = DateTime.UtcNow },
            new ConsultationRequest { RequestId = "r2", FullName = "B", RestaurantName = "Quán B", PhoneNumber = "02", Status = "Contacted", CreatedAt = DateTime.UtcNow }
        );
        await db.SaveChangesAsync();

        var svc = new ConsultationService(db);
        var result = await svc.GetAllAsync("New");

        Assert.Single(result);
        Assert.Equal("r1", result[0].RequestId);
    }

    [Fact]
    public async Task Consultation_UpdateStatus_SetsContactedAt()
    {
        await using var db = CreateInMemoryDb(nameof(Consultation_UpdateStatus_SetsContactedAt));
        db.ConsultationRequests.Add(
            new ConsultationRequest { RequestId = "r1", FullName = "A", RestaurantName = "Quán A", PhoneNumber = "01", Status = "New", CreatedAt = DateTime.UtcNow }
        );
        await db.SaveChangesAsync();

        var svc = new ConsultationService(db);
        await svc.UpdateStatusAsync("r1", "Contacted");

        var r = await db.ConsultationRequests.FindAsync("r1");
        Assert.Equal("Contacted", r!.Status);
        Assert.NotNull(r.ContactedAt);
    }

    [Fact]
    public async Task Consultation_UpdateStatus_InvalidStatus_ThrowsArgumentException()
    {
        await using var db = CreateInMemoryDb(nameof(Consultation_UpdateStatus_InvalidStatus_ThrowsArgumentException));
        db.ConsultationRequests.Add(
            new ConsultationRequest { RequestId = "r1", FullName = "A", RestaurantName = "Quán A", PhoneNumber = "01", Status = "New", CreatedAt = DateTime.UtcNow }
        );
        await db.SaveChangesAsync();

        var svc = new ConsultationService(db);
        await Assert.ThrowsAsync<ArgumentException>(() => svc.UpdateStatusAsync("r1", "INVALID_STATUS"));
    }
}
