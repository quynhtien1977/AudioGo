using Microsoft.EntityFrameworkCore;
using Server.Models;

namespace Server.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Account> Accounts => Set<Account>();
        public DbSet<Poi> Pois => Set<Poi>();
        public DbSet<PoiContent> PoiContents => Set<PoiContent>();
        public DbSet<PoiGallery> PoiGalleries => Set<PoiGallery>();
        public DbSet<Category> Categories => Set<Category>();
        public DbSet<CategoryPoi> CategoryPois => Set<CategoryPoi>();
        public DbSet<Tour> Tours => Set<Tour>();
        public DbSet<TourPoi> TourPois => Set<TourPoi>();
        public DbSet<ListenHistory> ListenHistories => Set<ListenHistory>();
        public DbSet<LocationLog> LocationLogs => Set<LocationLog>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // ── Composite PKs ─────────────────────────────────────────
            modelBuilder.Entity<CategoryPoi>()
                .HasKey(cp => new { cp.CategoryId, cp.PoiId });

            modelBuilder.Entity<TourPoi>()
                .HasKey(tp => new { tp.TourId, tp.PoiId });

            // ── Relationships ─────────────────────────────────────────
            modelBuilder.Entity<Poi>()
                .HasOne<Account>()
                .WithMany()
                .HasForeignKey(p => p.AccountId);

            modelBuilder.Entity<PoiContent>()
                .HasOne<Poi>()
                .WithMany()
                .HasForeignKey(pc => pc.PoiId);

            modelBuilder.Entity<PoiGallery>()
                .HasOne<Poi>()
                .WithMany()
                .HasForeignKey(pg => pg.PoiId);

            modelBuilder.Entity<CategoryPoi>()
                .HasOne<Category>()
                .WithMany()
                .HasForeignKey(cp => cp.CategoryId);

            modelBuilder.Entity<CategoryPoi>()
                .HasOne<Poi>()
                .WithMany()
                .HasForeignKey(cp => cp.PoiId);

            modelBuilder.Entity<TourPoi>()
                .HasOne<Tour>()
                .WithMany()
                .HasForeignKey(tp => tp.TourId);

            modelBuilder.Entity<TourPoi>()
                .HasOne<Poi>()
                .WithMany()
                .HasForeignKey(tp => tp.PoiId);

            modelBuilder.Entity<ListenHistory>()
                .HasOne<Poi>()
                .WithMany()
                .HasForeignKey(lh => lh.PoiId);

            // ── Indexes ───────────────────────────────────────────────
            modelBuilder.Entity<Poi>()
                .HasIndex(p => p.AccountId);
            modelBuilder.Entity<Poi>()
                .HasIndex(p => p.Status);

            modelBuilder.Entity<PoiContent>()
                .HasIndex(pc => pc.PoiId);
            modelBuilder.Entity<PoiContent>()
                .HasIndex(pc => pc.LanguageCode);

            modelBuilder.Entity<ListenHistory>()
                .HasIndex(lh => lh.DeviceId);
            modelBuilder.Entity<ListenHistory>()
                .HasIndex(lh => lh.Timestamp);

            modelBuilder.Entity<LocationLog>()
                .HasIndex(ll => ll.DeviceId);
            modelBuilder.Entity<LocationLog>()
                .HasIndex(ll => ll.Timestamp);
        }
    }
}
