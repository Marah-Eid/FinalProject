using Dorm.Application.Abstractions;
using Dorm.Domain.Entities;
using Dorm.Domain.Enums;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using AppApplication = Dorm.Domain.Entities.Application;

namespace Dorm.Infrastructure.Persistence;

public class AppDbContext(DbContextOptions<AppDbContext> options)
    : IdentityDbContext<User, IdentityRole<Guid>, Guid>(options), IAppDbContext
{
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<StudentProfile> StudentProfiles => Set<StudentProfile>();
    public DbSet<QuizAnswer> QuizAnswers => Set<QuizAnswer>();
    public DbSet<Apartment> Apartments => Set<Apartment>();
    public DbSet<ApartmentAmenity> ApartmentAmenities => Set<ApartmentAmenity>();
    public DbSet<ApartmentPhoto> ApartmentPhotos => Set<ApartmentPhoto>();
    public DbSet<Tenancy> Tenancies => Set<Tenancy>();
    public DbSet<AppApplication> Applications => Set<AppApplication>();
    public DbSet<Conversation> Conversations => Set<Conversation>();
    public DbSet<Message> Messages => Set<Message>();
    public DbSet<Rating> Ratings => Set<Rating>();
    public DbSet<SavedListing> SavedListings => Set<SavedListing>();
    public DbSet<Report> Reports => Set<Report>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<Testimonial> Testimonials => Set<Testimonial>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        base.OnModelCreating(b);

        // ─── User (extends IdentityUser<Guid> — PK + Email/PhoneNumber/PasswordHash come from base) ──
        b.Entity<User>(e =>
        {
            e.Property(u => u.FullName).HasMaxLength(120).IsRequired();
            e.Property(u => u.ProfilePhotoUrl).HasMaxLength(500);
            e.Property(u => u.PendingUniversityEmail).HasMaxLength(254);

            e.Property(u => u.Role).HasConversion<string>().HasMaxLength(20).IsRequired();
            e.Property(u => u.Gender).HasConversion<string>().HasMaxLength(20).IsRequired();
            e.Property(u => u.University).HasConversion<string?>().HasMaxLength(20);

            e.Property(u => u.EmailVerificationTokenHash).HasMaxLength(128);
            e.Property(u => u.PasswordResetTokenHash).HasMaxLength(128);
            e.Property(u => u.UniversityVerificationTokenHash).HasMaxLength(128);
        });

        // ─── RefreshToken ────────────────────────────────────────────────────
        b.Entity<RefreshToken>(e =>
        {
            e.HasKey(r => r.Id);
            e.Property(r => r.TokenHash).HasMaxLength(128).IsRequired();
            e.HasIndex(r => r.TokenHash).IsUnique();
            e.HasIndex(r => new { r.UserId, r.RevokedAt });

            e.HasOne(r => r.User)
                .WithMany(u => u.RefreshTokens)
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(r => r.ReplacedByToken)
                .WithMany()
                .HasForeignKey(r => r.ReplacedByTokenId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        // ─── StudentProfile ──────────────────────────────────────────────────
        b.Entity<StudentProfile>(e =>
        {
            e.HasKey(sp => sp.Id);
            e.HasIndex(sp => sp.UserId).IsUnique();
            e.Property(sp => sp.Major).HasMaxLength(120).IsRequired();
            e.Property(sp => sp.Bio).HasMaxLength(1000);

            e.HasOne(sp => sp.User)
                .WithOne(u => u.StudentProfile)
                .HasForeignKey<StudentProfile>(sp => sp.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ─── QuizAnswer ──────────────────────────────────────────────────────
        b.Entity<QuizAnswer>(e =>
        {
            e.HasKey(q => q.Id);
            e.Property(q => q.QuestionKey).HasConversion<string>().HasMaxLength(30).IsRequired();
            e.Property(q => q.AnswerValue).HasMaxLength(40).IsRequired();
            e.HasIndex(q => new { q.StudentProfileId, q.QuestionKey }).IsUnique();

            e.HasOne(q => q.StudentProfile)
                .WithMany(sp => sp.QuizAnswers)
                .HasForeignKey(q => q.StudentProfileId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ─── Apartment ───────────────────────────────────────────────────────
        b.Entity<Apartment>(e =>
        {
            e.HasKey(a => a.Id);
            e.Property(a => a.Title).HasMaxLength(140).IsRequired();
            e.Property(a => a.Description).HasMaxLength(4000).IsRequired();
            e.Property(a => a.Neighborhood).HasMaxLength(120).IsRequired();
            e.Property(a => a.AddressDetail).HasMaxLength(500).IsRequired();
            e.Property(a => a.FullRent).HasPrecision(10, 2);

            e.Property(a => a.City).HasConversion<string>().HasMaxLength(20).IsRequired();
            e.Property(a => a.GenderType).HasConversion<string>().HasMaxLength(20).IsRequired();
            e.Property(a => a.NearestUniversity).HasConversion<string>().HasMaxLength(20).IsRequired();
            e.Property(a => a.SmokingRule).HasConversion<string>().HasMaxLength(20).IsRequired();
            e.Property(a => a.GuestsRule).HasConversion<string>().HasMaxLength(20).IsRequired();
            e.Property(a => a.DistanceRange).HasConversion<string>().HasMaxLength(20).IsRequired();

            // Browse-query indexes — the visibility filters land here.
            e.HasIndex(a => new { a.IsActive, a.IsSuspended });
            e.HasIndex(a => new { a.City, a.IsActive });
            e.HasIndex(a => new { a.NearestUniversity, a.IsActive });
            e.HasIndex(a => new { a.GenderType, a.IsActive });
            e.HasIndex(a => a.FullRent);
            e.HasIndex(a => a.AvailableSpots);
            e.HasIndex(a => a.CreatedAt);

            e.HasOne(a => a.Owner)
                .WithMany()
                .HasForeignKey(a => a.OwnerId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ─── ApartmentAmenity ────────────────────────────────────────────────
        b.Entity<ApartmentAmenity>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.AmenityType).HasConversion<string>().HasMaxLength(30).IsRequired();
            e.HasIndex(x => new { x.ApartmentId, x.AmenityType }).IsUnique();

            e.HasOne(x => x.Apartment)
                .WithMany(a => a.Amenities)
                .HasForeignKey(x => x.ApartmentId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ─── ApartmentPhoto ──────────────────────────────────────────────────
        b.Entity<ApartmentPhoto>(e =>
        {
            e.HasKey(p => p.Id);
            e.Property(p => p.PhotoUrl).HasMaxLength(500).IsRequired();
            e.HasIndex(p => new { p.ApartmentId, p.DisplayOrder });

            e.HasOne(p => p.Apartment)
                .WithMany(a => a.Photos)
                .HasForeignKey(p => p.ApartmentId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ─── Tenancy ─────────────────────────────────────────────────────────
        b.Entity<Tenancy>(e =>
        {
            e.HasKey(t => t.Id);
            e.Property(t => t.Status).HasConversion<string>().HasMaxLength(20).IsRequired();
            e.HasIndex(t => new { t.ApartmentId, t.Status });
            e.HasIndex(t => new { t.StudentId, t.Status });

            e.HasOne(t => t.Apartment)
                .WithMany(a => a.Tenancies)
                .HasForeignKey(t => t.ApartmentId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(t => t.Student)
                .WithMany()
                .HasForeignKey(t => t.StudentId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ─── Application ─────────────────────────────────────────────────────
        b.Entity<AppApplication>(e =>
        {
            e.HasKey(a => a.Id);
            e.Property(a => a.Message).HasMaxLength(500).IsRequired();
            e.Property(a => a.Status).HasConversion<string>().HasMaxLength(20).IsRequired();
            e.HasIndex(a => new { a.ApartmentId, a.Status });
            e.HasIndex(a => new { a.StudentId, a.Status });

            e.HasOne(a => a.Apartment)
                .WithMany(ap => ap.Applications)
                .HasForeignKey(a => a.ApartmentId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(a => a.Student)
                .WithMany()
                .HasForeignKey(a => a.StudentId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ─── Conversation ────────────────────────────────────────────────────
        b.Entity<Conversation>(e =>
        {
            e.HasKey(c => c.Id);
            e.HasIndex(c => new { c.Participant1Id, c.Participant2Id, c.ApartmentId }).IsUnique();
            e.HasIndex(c => c.LastMessageAt);

            e.HasOne(c => c.Participant1)
                .WithMany()
                .HasForeignKey(c => c.Participant1Id)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(c => c.Participant2)
                .WithMany()
                .HasForeignKey(c => c.Participant2Id)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(c => c.Apartment)
                .WithMany()
                .HasForeignKey(c => c.ApartmentId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ─── Message ─────────────────────────────────────────────────────────
        b.Entity<Message>(e =>
        {
            e.HasKey(m => m.Id);
            e.Property(m => m.Content).HasMaxLength(4000).IsRequired();
            e.HasIndex(m => new { m.ConversationId, m.SentAt });

            e.HasOne(m => m.Conversation)
                .WithMany(c => c.Messages)
                .HasForeignKey(m => m.ConversationId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(m => m.Sender)
                .WithMany()
                .HasForeignKey(m => m.SenderId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ─── Rating ──────────────────────────────────────────────────────────
        b.Entity<Rating>(e =>
        {
            e.HasKey(r => r.Id);
            e.Property(r => r.Comment).HasMaxLength(1000);
            e.HasIndex(r => r.RatedUserId);
            e.HasIndex(r => new { r.RaterId, r.RatedUserId, r.ApartmentId }).IsUnique();

            e.HasOne(r => r.Rater)
                .WithMany()
                .HasForeignKey(r => r.RaterId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(r => r.RatedUser)
                .WithMany()
                .HasForeignKey(r => r.RatedUserId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(r => r.Apartment)
                .WithMany()
                .HasForeignKey(r => r.ApartmentId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ─── SavedListing ────────────────────────────────────────────────────
        b.Entity<SavedListing>(e =>
        {
            e.HasKey(s => s.Id);
            e.HasIndex(s => new { s.StudentId, s.ApartmentId }).IsUnique();

            e.HasOne(s => s.Student)
                .WithMany()
                .HasForeignKey(s => s.StudentId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(s => s.Apartment)
                .WithMany()
                .HasForeignKey(s => s.ApartmentId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ─── Report ──────────────────────────────────────────────────────────
        b.Entity<Report>(e =>
        {
            e.HasKey(r => r.Id);
            e.Property(r => r.Description).HasMaxLength(2000);
            e.Property(r => r.Reason).HasConversion<string>().HasMaxLength(30).IsRequired();
            e.Property(r => r.Status).HasConversion<string>().HasMaxLength(20).IsRequired();
            e.HasIndex(r => new { r.ReportedApartmentId, r.Status });

            e.HasOne(r => r.Reporter)
                .WithMany()
                .HasForeignKey(r => r.ReporterId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(r => r.ReportedApartment)
                .WithMany()
                .HasForeignKey(r => r.ReportedApartmentId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(r => r.ResolvedByAdmin)
                .WithMany()
                .HasForeignKey(r => r.ResolvedByAdminId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // ─── Payment ─────────────────────────────────────────────────────────
        b.Entity<Payment>(e =>
        {
            e.HasKey(p => p.Id);
            e.Property(p => p.Amount).HasPrecision(10, 2);
            e.Property(p => p.Type).HasConversion<string>().HasMaxLength(30).IsRequired();
            e.Property(p => p.Status).HasConversion<string>().HasMaxLength(20).IsRequired();
            e.Property(p => p.TransactionRef).HasMaxLength(80);
            e.HasIndex(p => new { p.UserId, p.CreatedAt });
            e.HasIndex(p => p.CreatedAt);

            e.HasOne(p => p.User)
                .WithMany()
                .HasForeignKey(p => p.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ─── Notification ────────────────────────────────────────────────────
        b.Entity<Notification>(e =>
        {
            e.HasKey(n => n.Id);
            e.Property(n => n.Title).HasMaxLength(140).IsRequired();
            e.Property(n => n.Content).HasMaxLength(1000).IsRequired();
            e.Property(n => n.Type).HasConversion<string>().HasMaxLength(40).IsRequired();
            e.HasIndex(n => new { n.UserId, n.IsRead, n.CreatedAt });

            e.HasOne(n => n.User)
                .WithMany()
                .HasForeignKey(n => n.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ─── Testimonial ────────────────────────────────────────────────────
        b.Entity<Testimonial>(e =>
        {
            e.HasKey(t => t.Id);
            e.Property(t => t.Text).HasMaxLength(500).IsRequired();
            e.Property(t => t.Stars).IsRequired();

            e.HasOne(t => t.User)
                .WithMany()
                .HasForeignKey(t => t.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
