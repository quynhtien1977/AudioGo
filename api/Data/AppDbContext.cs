using Microsoft.EntityFrameworkCore;
using Server.Models;

namespace Server.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Account>             Accounts          => Set<Account>();
        public DbSet<Poi>                 Pois              => Set<Poi>();
        public DbSet<PoiContent>          PoiContents       => Set<PoiContent>();
        public DbSet<PoiGallery>          PoiGalleries      => Set<PoiGallery>();
        public DbSet<Category>            Categories        => Set<Category>();
        public DbSet<CategoryPoi>         CategoryPois      => Set<CategoryPoi>();
        public DbSet<Tour>                Tours             => Set<Tour>();
        public DbSet<TourPoi>             TourPois          => Set<TourPoi>();
        public DbSet<ListenHistory>       ListenHistories   => Set<ListenHistory>();
        public DbSet<LocationLog>         LocationLogs      => Set<LocationLog>();
        public DbSet<AppAccessCode>       AppAccessCodes    => Set<AppAccessCode>();
        public DbSet<PoiRequest>          PoiRequests       => Set<PoiRequest>();
        public DbSet<SubscriptionPlan>    SubscriptionPlans => Set<SubscriptionPlan>();
        public DbSet<OwnerSubscription>   OwnerSubscriptions => Set<OwnerSubscription>();
        public DbSet<PaymentTransaction>  PaymentTransactions => Set<PaymentTransaction>();
        
        public DbSet<Article>             Articles          => Set<Article>();
        public DbSet<ArticleContent>      ArticleContents   => Set<ArticleContent>();

        protected override void OnModelCreating(ModelBuilder m)
        {
            // ── 1. Map sang tên bảng singular trong DB ─────────────────
            //    Các bảng có AFTER UPDATE trigger phải khai báo HasTrigger()
            //    để EF Core 7+ không dùng OUTPUT clause (gây lỗi).
            m.Entity<Account>      ().ToTable("Account",       t => t.HasTrigger("TR_Account_UpdateTimestamp"));
            m.Entity<Poi>          ().ToTable("Poi",            t => t.HasTrigger("TR_Poi_UpdateTimestamp"));
            m.Entity<PoiContent>   ().ToTable("PoiContent",     t => t.HasTrigger("TR_PoiContent_UpdateTimestamp"));
            m.Entity<PoiGallery>   ().ToTable("PoiGallery",     t => t.HasTrigger("TR_PoiGallery_UpdateTimestamp"));
            m.Entity<Category>     ().ToTable("Category",       t => t.HasTrigger("TR_Category_UpdateTimestamp"));
            m.Entity<CategoryPoi>  ().ToTable("CategoryPoi");
            m.Entity<Tour>         ().ToTable("Tour",           t => t.HasTrigger("TR_Tour_UpdateTimestamp"));
            m.Entity<TourPoi>      ().ToTable("TourPoi");
            m.Entity<ListenHistory>().ToTable("ListenHistory");
            m.Entity<LocationLog>  ().ToTable("LocationLog");
            m.Entity<AppAccessCode>().ToTable("AppAccessCode");
            m.Entity<PoiRequest>   ().ToTable("PoiRequest", t => t.HasTrigger("TR_PoiRequest_UpdateTimestamp"));
            m.Entity<SubscriptionPlan>   ().ToTable("SubscriptionPlan");
            m.Entity<OwnerSubscription>  ().ToTable("OwnerSubscription",  t => t.HasTrigger("TR_OwnerSubscription_UpdateTimestamp"));
            m.Entity<PaymentTransaction> ().ToTable("PaymentTransaction",  t => t.HasTrigger("TR_PaymentTransaction_UpdateTimestamp"));
            m.Entity<Article>            ().ToTable("Article",            t => t.HasTrigger("TR_Article_UpdateTimestamp"));
            m.Entity<ArticleContent>     ().ToTable("ArticleContent");

            // ── 2. Primary Keys ─────────────────────────────────────────
            m.Entity<PoiContent>   ().HasKey(e => e.ContentId);
            m.Entity<PoiGallery>   ().HasKey(e => e.ImageId);
            m.Entity<ListenHistory>().HasKey(e => e.HistoryId);
            m.Entity<LocationLog>  ().HasKey(e => e.LocationId);

            // Composite PKs — PHẢI khai báo trước relationships
            m.Entity<CategoryPoi>().HasKey(e => new { e.CategoryId, e.PoiId });
            m.Entity<TourPoi>    ().HasKey(e => new { e.TourId,     e.PoiId });
            m.Entity<ArticleContent>().HasKey(e => new { e.ArticleId, e.Lang });

            // ── 3. Relationships — PHẢI chỉ rõ CÙNG nav prop ở CẢ 2 phía
            //       để EF Core không tự tạo relationship thứ 2 (gây shadow FK)

            // Poi → Account (nhiều POI thuộc 1 account)
            m.Entity<Poi>()
                .HasOne(p => p.Account)
                .WithMany()           // Account KHÔNG có ICollection<Poi>
                .HasForeignKey(p => p.AccountId)
                .OnDelete(DeleteBehavior.Restrict);

            // PoiContent → Poi
            m.Entity<PoiContent>()
                .HasOne(pc => pc.Poi)
                .WithMany(p => p.Contents)   // Poi.Contents
                .HasForeignKey(pc => pc.PoiId)
                .OnDelete(DeleteBehavior.Cascade);

            // PoiGallery → Poi
            m.Entity<PoiGallery>()
                .HasOne(pg => pg.Poi)
                .WithMany(p => p.Gallery)    // Poi.Gallery
                .HasForeignKey(pg => pg.PoiId)
                .OnDelete(DeleteBehavior.Cascade);

            // CategoryPoi → Category  (PHẢI dùng Category.CategoryPois!)
            m.Entity<CategoryPoi>()
                .HasOne(cp => cp.Category)
                .WithMany(c => c.CategoryPois)   // ← fix: Category HAS nav prop
                .HasForeignKey(cp => cp.CategoryId)
                .OnDelete(DeleteBehavior.Cascade);

            // CategoryPoi → Poi  (PHẢI dùng Poi.CategoryPois!)
            m.Entity<CategoryPoi>()
                .HasOne(cp => cp.Poi)
                .WithMany(p => p.CategoryPois)   // Poi.CategoryPois
                .HasForeignKey(cp => cp.PoiId)
                .OnDelete(DeleteBehavior.Cascade);

            // TourPoi → Tour  (PHẢI dùng Tour.TourPois!)
            m.Entity<TourPoi>()
                .HasOne(tp => tp.Tour)
                .WithMany(t => t.TourPois)       // ← fix: Tour HAS nav prop
                .HasForeignKey(tp => tp.TourId)
                .OnDelete(DeleteBehavior.Cascade);

            // TourPoi → Poi
            m.Entity<TourPoi>()
                .HasOne(tp => tp.Poi)
                .WithMany()           // Poi KHÔNG có ICollection<TourPoi>
                .HasForeignKey(tp => tp.PoiId)
                .OnDelete(DeleteBehavior.Cascade);

            // ListenHistory → Poi (không CASCADE theo schema)
            m.Entity<ListenHistory>()
                .HasOne(lh => lh.Poi)
                .WithMany()           // Poi KHÔNG có ICollection<ListenHistory>
                .HasForeignKey(lh => lh.PoiId)
                .OnDelete(DeleteBehavior.Restrict);

            // Article → ArticleContent
            m.Entity<Article>()
                .HasMany(a => a.Contents)
                .WithOne(c => c.Article)
                .HasForeignKey(c => c.ArticleId)
                .OnDelete(DeleteBehavior.Cascade);

            // ── 4. Unique index ─────────────────────────────────────────
            m.Entity<PoiContent>()
                .HasIndex(pc => new { pc.PoiId, pc.LanguageCode })
                .IsUnique();

            m.Entity<AppAccessCode>().HasKey(e => e.CodeId);
            m.Entity<AppAccessCode>()
                .HasIndex(e => e.Code)
                .IsUnique();

            // ── PoiRequest ───────────────────────────────────────────────────────
            m.Entity<PoiRequest>().HasKey(e => e.RequestId);

            // PoiRequest → Account (chủ quán gửi yêu cầu)
            m.Entity<PoiRequest>()
                .HasOne(r => r.Account)
                .WithMany()
                .HasForeignKey(r => r.AccountId)
                .OnDelete(DeleteBehavior.Restrict);

            // PoiRequest → Poi (nullable: NULL khi ActionType = CREATE)
            m.Entity<PoiRequest>()
                .HasOne(r => r.Poi)
                .WithMany()
                .HasForeignKey(r => r.PoiId)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.SetNull);

            // Index để query nhanh theo trạng thái
            m.Entity<PoiRequest>()
                .HasIndex(r => r.Status)
                .HasDatabaseName("IX_PoiRequest_Status");

            // Index theo POI để kiểm tra POI có đang có request PENDING không
            m.Entity<PoiRequest>()
                .HasIndex(r => new { r.PoiId, r.Status })
                .HasDatabaseName("IX_PoiRequest_PoiId_Status");

            // ── SubscriptionPlan ──────────────────────────────────────────────────────
            m.Entity<SubscriptionPlan>().HasKey(e => e.PlanId);

            // Decimal precision
            m.Entity<SubscriptionPlan>()
                .Property(p => p.Price)
                .HasPrecision(18, 2);

            // SubscriptionPlan → Account (một Owner có SubscriptionPlanId shortcut)
            m.Entity<Account>()
                .HasOne(a => a.SubscriptionPlan)
                .WithMany()
                .HasForeignKey(a => a.SubscriptionPlanId)
                .OnDelete(DeleteBehavior.Restrict);

            // ── OwnerSubscription ─────────────────────────────────────────────────────
            m.Entity<OwnerSubscription>().HasKey(e => e.SubscriptionId);

            // OwnerSubscription → Account
            m.Entity<OwnerSubscription>()
                .HasOne(s => s.Account)
                .WithMany(a => a.Subscriptions)
                .HasForeignKey(s => s.AccountId)
                .OnDelete(DeleteBehavior.Cascade);

            // OwnerSubscription → SubscriptionPlan
            m.Entity<OwnerSubscription>()
                .HasOne(s => s.Plan)
                .WithMany(p => p.Subscriptions)
                .HasForeignKey(s => s.PlanId)
                .OnDelete(DeleteBehavior.Restrict);

            // 1 Account chỉ có 1 subscription ACTIVE tại 1 thời điểm
            // (Filtered unique index — SQL Server partial index)
            m.Entity<OwnerSubscription>()
                .HasIndex(s => s.AccountId)
                .HasFilter("[Status] = 'ACTIVE'")
                .IsUnique()
                .HasDatabaseName("IX_OwnerSubscription_Account_Active");

            // Index tìm kiếm subscription theo account + status
            m.Entity<OwnerSubscription>()
                .HasIndex(s => new { s.AccountId, s.Status })
                .HasDatabaseName("IX_OwnerSubscription_AccountId_Status");

            // ── PaymentTransaction ────────────────────────────────────────────────────
            m.Entity<PaymentTransaction>().HasKey(e => e.TransactionId);

            // Decimal precision
            m.Entity<PaymentTransaction>()
                .Property(t => t.Amount)
                .HasPrecision(18, 2);

            // PaymentTransaction → Account (nullable — tourist payment không có AccountId)
            m.Entity<PaymentTransaction>()
                .HasOne(t => t.Account)
                .WithMany(a => a.Transactions)
                .HasForeignKey(t => t.AccountId)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.Restrict);

            // PaymentType: 'TOURIST_ACCESS' | 'OWNER_SUBSCRIPTION'
            m.Entity<PaymentTransaction>()
                .Property(t => t.PaymentType)
                .HasDefaultValue("TOURIST_ACCESS");

            // PaymentTransaction → SubscriptionPlan
            m.Entity<PaymentTransaction>()
                .HasOne(t => t.Plan)
                .WithMany()
                .HasForeignKey(t => t.PlanId)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.Restrict);

            // PaymentTransaction → OwnerSubscription (nullable)
            m.Entity<PaymentTransaction>()
                .HasOne(t => t.Subscription)
                .WithMany()
                .HasForeignKey(t => t.SubscriptionId)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.SetNull);

            // PaymentTransaction → AppAccessCode (nullable)
            m.Entity<PaymentTransaction>()
                .HasOne(t => t.ActivationCode)
                .WithMany()
                .HasForeignKey(t => t.ActivationCodeId)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.SetNull);

            // Index đối soát theo gateway trans ID
            m.Entity<PaymentTransaction>()
                .HasIndex(t => t.GatewayTransId)
                .HasDatabaseName("IX_PaymentTransaction_GatewayTransId");

            m.Entity<PaymentTransaction>()
                .HasIndex(t => new { t.AccountId, t.Status })
                .HasDatabaseName("IX_PaymentTransaction_AccountId_Status");

            // ── AppAccessCode → SubscriptionPlan (nullable) ───────────────────────────
            m.Entity<AppAccessCode>()
                .HasOne(c => c.Plan)
                .WithMany()
                .HasForeignKey(c => c.PlanId)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.SetNull);

            // ── Seed Data: 3 gói đăng ký (tất cả tính phí) ───────────────────────────
            m.Entity<SubscriptionPlan>().HasData(
                new SubscriptionPlan
                {
                    PlanId      = "basic",
                    Name        = "Cơ bản",
                    Price       = 199000,
                    DurationDay = 30,
                    MaxPoiCount = 3,
                    AutoPriority = 1,
                    Features    = "[\"audio_guide\"]",
                    IsActive    = true,
                    CreatedAt   = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new SubscriptionPlan
                {
                    PlanId      = "professional",
                    Name        = "Chuyên nghiệp",
                    Price       = 499000,
                    DurationDay = 30,
                    MaxPoiCount = 10,
                    AutoPriority = 2,
                    Features    = "[\"audio_guide\",\"analytics\",\"priority_support\"]",
                    IsActive    = true,
                    CreatedAt   = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new SubscriptionPlan
                {
                    PlanId      = "enterprise",
                    Name        = "Doanh nghiệp",
                    Price       = 999000,
                    DurationDay = 30,
                    MaxPoiCount = -1,  // -1 = không giới hạn
                    AutoPriority = 3,
                    Features    = "[\"audio_guide\",\"analytics\",\"priority_support\",\"custom_branding\",\"dedicated_account_manager\"]",
                    IsActive    = true,
                    CreatedAt   = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                }
            );
        }
    }
}
