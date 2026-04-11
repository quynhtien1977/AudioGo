using Microsoft.EntityFrameworkCore;
using Server.Models;

namespace Server.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Account>       Accounts        => Set<Account>();
        public DbSet<Poi>           Pois            => Set<Poi>();
        public DbSet<PoiContent>    PoiContents     => Set<PoiContent>();
        public DbSet<PoiGallery>    PoiGalleries    => Set<PoiGallery>();
        public DbSet<Category>      Categories      => Set<Category>();
        public DbSet<CategoryPoi>   CategoryPois    => Set<CategoryPoi>();
        public DbSet<Tour>          Tours           => Set<Tour>();
        public DbSet<TourPoi>       TourPois        => Set<TourPoi>();
        public DbSet<ListenHistory> ListenHistories => Set<ListenHistory>();
        public DbSet<LocationLog>   LocationLogs    => Set<LocationLog>();
        public DbSet<AppAccessCode> AppAccessCodes  => Set<AppAccessCode>();
        public DbSet<PoiRequest>    PoiRequests     => Set<PoiRequest>();
        

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

            // ── 2. Primary Keys ─────────────────────────────────────────
            m.Entity<PoiContent>   ().HasKey(e => e.ContentId);
            m.Entity<PoiGallery>   ().HasKey(e => e.ImageId);
            m.Entity<ListenHistory>().HasKey(e => e.HistoryId);
            m.Entity<LocationLog>  ().HasKey(e => e.LocationId);

            // Composite PKs — PHẢI khai báo trước relationships
            m.Entity<CategoryPoi>().HasKey(e => new { e.CategoryId, e.PoiId });
            m.Entity<TourPoi>    ().HasKey(e => new { e.TourId,     e.PoiId });

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
                .HasIndex(r => r.ApprovalStatus)
                .HasDatabaseName("IX_PoiRequest_ApprovalStatus");

            // Index theo POI để kiểm tra POI có đang có request PENDING không
            m.Entity<PoiRequest>()
                .HasIndex(r => new { r.PoiId, r.ApprovalStatus })
                .HasDatabaseName("IX_PoiRequest_PoiId_ApprovalStatus");
        }
    }
}
