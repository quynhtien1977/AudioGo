using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Services;
using Shared.DTOs;
using Xunit;

namespace Api.Tests.Services;

public class AccessCodeServiceTests
{
    private static AppDbContext CreateDb(string name)
    {
        var opts = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(name)
            .Options;
        return new AppDbContext(opts);
    }

    [Fact]
    public async Task GetPagedAsync_ReturnsMostRecentFirst()
    {
        using var db = CreateDb(nameof(GetPagedAsync_ReturnsMostRecentFirst));
        db.AppAccessCodes.AddRange(
            new AppAccessCode { Code = "AAAAAAAA", CreatedAt = DateTime.UtcNow.AddDays(-2), Type = "TRIAL" },
            new AppAccessCode { Code = "BBBBBBBB", CreatedAt = DateTime.UtcNow.AddDays(-1), Type = "TRIAL" },
            new AppAccessCode { Code = "CCCCCCCC", CreatedAt = DateTime.UtcNow,             Type = "TRIAL" }
        );
        await db.SaveChangesAsync();

        var service = new AccessCodeService(db);
        var result  = await service.GetPagedAsync(1, 10);

        Assert.Equal(3, result.Pagination.TotalItems);
        Assert.Equal("CCCCCCCC", result.Data[0].Code); // Mới nhất trước
        Assert.Equal("AAAAAAAA", result.Data[2].Code);
    }

    [Fact]
    public async Task GetPagedAsync_PaginationCorrect()
    {
        using var db = CreateDb(nameof(GetPagedAsync_PaginationCorrect));
        for (int i = 0; i < 15; i++)
            db.AppAccessCodes.Add(new AppAccessCode { Code = $"CODE{i:D4}", CreatedAt = DateTime.UtcNow, Type = "TRIAL" });
        await db.SaveChangesAsync();

        var service = new AccessCodeService(db);
        var page1   = await service.GetPagedAsync(1, 10);
        var page2   = await service.GetPagedAsync(2, 10);

        Assert.Equal(15, page1.Pagination.TotalItems);
        Assert.Equal(2, page1.Pagination.TotalPages);
        Assert.Equal(10, page1.Data.Count);
        Assert.Equal(5, page2.Data.Count);
    }

    [Fact]
    public async Task CreateCodesAsync_GeneratesCorrectCount()
    {
        using var db = CreateDb(nameof(CreateCodesAsync_GeneratesCorrectCount));
        var service = new AccessCodeService(db);

        var (created, error) = await service.CreateCodesAsync(5);

        Assert.Null(error);
        Assert.Equal(5, created.Count);
        Assert.Equal(5, await db.AppAccessCodes.CountAsync());

        // Mỗi mã đúng 8 ký tự, chỉ chứa chữ hoa và số
        foreach (var c in created)
        {
            Assert.Equal(8, c.Code.Length);
            Assert.True(c.Code.All(ch => char.IsLetterOrDigit(ch) && char.IsUpper(ch) || char.IsDigit(ch)));
            Assert.Equal("TRIAL", c.Type);
        }
    }

    [Fact]
    public async Task CreateCodesAsync_ReturnsErrorWhenOutOfRange()
    {
        using var db = CreateDb(nameof(CreateCodesAsync_ReturnsErrorWhenOutOfRange));
        var service = new AccessCodeService(db);

        var (created0, err0) = await service.CreateCodesAsync(0);
        Assert.NotNull(err0);
        Assert.Empty(created0);

        var (created101, err101) = await service.CreateCodesAsync(101);
        Assert.NotNull(err101);
        Assert.Empty(created101);
    }

    [Fact]
    public async Task CreateCodesAsync_CodesAreUnique()
    {
        using var db = CreateDb(nameof(CreateCodesAsync_CodesAreUnique));
        var service = new AccessCodeService(db);

        // Sinh 50 mã — xác suất trùng cực thấp nếu dùng RNG đúng
        var (created, _) = await service.CreateCodesAsync(50);
        var unique = created.Select(c => c.Code).Distinct().Count();
        Assert.Equal(50, unique);
    }

    [Fact]
    public async Task DeleteCodeAsync_DeletesExistingCode()
    {
        using var db = CreateDb(nameof(DeleteCodeAsync_DeletesExistingCode));
        db.AppAccessCodes.Add(new AppAccessCode { Code = "XXXXXXXX", CreatedAt = DateTime.UtcNow, Type = "TRIAL" });
        await db.SaveChangesAsync();

        var code    = await db.AppAccessCodes.FirstAsync();
        var service = new AccessCodeService(db);

        var result = await service.DeleteCodeAsync(code.CodeId);

        Assert.True(result);
        Assert.Equal(0, await db.AppAccessCodes.CountAsync());
    }

    [Fact]
    public async Task DeleteCodeAsync_ReturnsFalseForNonExistentId()
    {
        using var db = CreateDb(nameof(DeleteCodeAsync_ReturnsFalseForNonExistentId));
        var service = new AccessCodeService(db);

        var result = await service.DeleteCodeAsync(99999);

        Assert.False(result);
    }
}
