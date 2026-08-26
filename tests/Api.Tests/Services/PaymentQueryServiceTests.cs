using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Services;
using Shared.DTOs;
using Xunit;

namespace Api.Tests.Services;

public class PaymentQueryServiceTests
{
    private static AppDbContext CreateDb(string name)
    {
        var opts = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(name)
            .Options;
        return new AppDbContext(opts);
    }

    private static void SeedTransactions(AppDbContext db)
    {
        db.SubscriptionPlans.AddRange(
            new SubscriptionPlan { PlanId = "plan-basic", Name = "Gói Cơ Bản", Price = 199000, DurationDay = 30 },
            new SubscriptionPlan { PlanId = "plan-pro",   Name = "Gói Pro",     Price = 499000, DurationDay = 90 }
        );
        db.Accounts.AddRange(
            new Account { AccountId = "acc-1", Username = "owner1", Email = "owner1@test.com", PasswordHash = "x", Role = "Owner" },
            new Account { AccountId = "acc-2", Username = "owner2", Email = "owner2@test.com", PasswordHash = "x", Role = "Owner" }
        );
        db.PaymentTransactions.AddRange(
            new PaymentTransaction
            {
                TransactionId = "tx-001", AccountId = "acc-1", PlanId = "plan-basic",
                PaymentType = "SUBSCRIPTION", Amount = 199000, Currency = "VND",
                Gateway = "VNPay", Status = "COMPLETED", CreatedAt = DateTime.UtcNow.AddDays(-5)
            },
            new PaymentTransaction
            {
                TransactionId = "tx-002", AccountId = "acc-1", PlanId = "plan-pro",
                PaymentType = "SUBSCRIPTION", Amount = 499000, Currency = "VND",
                Gateway = "MoMo", Status = "PENDING", CreatedAt = DateTime.UtcNow.AddDays(-2)
            },
            new PaymentTransaction
            {
                TransactionId = "tx-003", AccountId = "acc-2", PlanId = "plan-basic",
                PaymentType = "SUBSCRIPTION", Amount = 199000, Currency = "VND",
                Gateway = "VNPay", Status = "COMPLETED", CreatedAt = DateTime.UtcNow.AddDays(-1)
            }
        );
        db.SaveChanges();
    }

    [Fact]
    public async Task GetAllAsync_NoFilter_ReturnsAllOrderedByDateDesc()
    {
        using var db = CreateDb(nameof(GetAllAsync_NoFilter_ReturnsAllOrderedByDateDesc));
        SeedTransactions(db);

        var service = new PaymentQueryService(db);
        var result  = await service.GetAllAsync(new PaymentFilter());

        Assert.Equal(3, result.Pagination.TotalItems);
        Assert.Equal("tx-003", result.Data[0].TransactionId); // Mới nhất trước
    }

    [Fact]
    public async Task GetAllAsync_FilterByStatus_ReturnsMatchingOnly()
    {
        using var db = CreateDb(nameof(GetAllAsync_FilterByStatus_ReturnsMatchingOnly));
        SeedTransactions(db);

        var service = new PaymentQueryService(db);
        var result  = await service.GetAllAsync(new PaymentFilter(Status: "COMPLETED"));

        Assert.Equal(2, result.Pagination.TotalItems);
        Assert.All(result.Data, tx => Assert.Equal("COMPLETED", tx.Status));
    }

    [Fact]
    public async Task GetAllAsync_FilterByGateway_ReturnsMatchingOnly()
    {
        using var db = CreateDb(nameof(GetAllAsync_FilterByGateway_ReturnsMatchingOnly));
        SeedTransactions(db);

        var service = new PaymentQueryService(db);
        var result  = await service.GetAllAsync(new PaymentFilter(Gateway: "MoMo"));

        Assert.Equal(1, result.Pagination.TotalItems);
        Assert.Equal("tx-002", result.Data[0].TransactionId);
    }

    [Fact]
    public async Task GetAllAsync_FilterByAccountId_ReturnsMatchingOnly()
    {
        using var db = CreateDb(nameof(GetAllAsync_FilterByAccountId_ReturnsMatchingOnly));
        SeedTransactions(db);

        var service = new PaymentQueryService(db);
        var result  = await service.GetAllAsync(new PaymentFilter(AccountId: "acc-1"));

        Assert.Equal(2, result.Pagination.TotalItems);
        Assert.All(result.Data, tx => Assert.Equal("acc-1", tx.AccountId));
    }

    [Fact]
    public async Task GetMyAsync_ReturnsOnlyOwnTransactions()
    {
        using var db = CreateDb(nameof(GetMyAsync_ReturnsOnlyOwnTransactions));
        SeedTransactions(db);

        var service = new PaymentQueryService(db);
        var result  = await service.GetMyAsync("acc-2", 1, 20);

        Assert.Equal(1, result.Pagination.TotalItems);
        Assert.Equal("tx-003", result.Data[0].TransactionId);
    }

    [Fact]
    public async Task GetMyAsync_ReturnsEmptyForAccountWithNoTransactions()
    {
        using var db = CreateDb(nameof(GetMyAsync_ReturnsEmptyForAccountWithNoTransactions));
        SeedTransactions(db);

        var service = new PaymentQueryService(db);
        var result  = await service.GetMyAsync("acc-unknown", 1, 20);

        Assert.Equal(0, result.Pagination.TotalItems);
        Assert.Empty(result.Data);
    }

    [Fact]
    public async Task GetByIdAsync_ReturnsDetailWithPlan()
    {
        using var db = CreateDb(nameof(GetByIdAsync_ReturnsDetailWithPlan));
        SeedTransactions(db);

        var service = new PaymentQueryService(db);
        var detail  = await service.GetByIdAsync("tx-001");

        Assert.NotNull(detail);
        Assert.Equal("tx-001",     detail?.TransactionId);
        Assert.Equal("COMPLETED",  detail?.Status);
        Assert.Equal("plan-basic", detail?.Plan?.PlanId);
        Assert.Equal("Gói Cơ Bản", detail?.Plan?.Name);
    }

    [Fact]
    public async Task GetByIdAsync_ReturnsNullForNonExistentId()
    {
        using var db = CreateDb(nameof(GetByIdAsync_ReturnsNullForNonExistentId));
        SeedTransactions(db);

        var service = new PaymentQueryService(db);
        var detail  = await service.GetByIdAsync("tx-NOT-FOUND");

        Assert.Null(detail);
    }

    [Fact]
    public async Task GetAllAsync_PaginationWorksCorrectly()
    {
        using var db = CreateDb(nameof(GetAllAsync_PaginationWorksCorrectly));
        SeedTransactions(db); // 3 giao dịch

        var service = new PaymentQueryService(db);
        var page1   = await service.GetAllAsync(new PaymentFilter(Page: 1, PageSize: 2));
        var page2   = await service.GetAllAsync(new PaymentFilter(Page: 2, PageSize: 2));

        Assert.Equal(2, page1.Data.Count);
        Assert.Equal(1, page2.Data.Count);
        Assert.Equal(2, page1.Pagination.TotalPages);
        Assert.Equal(3, page1.Pagination.TotalItems);
    }
}
