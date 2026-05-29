using Dorm.Domain.Entities;
using Microsoft.EntityFrameworkCore;
// Alias because the `Application` entity collides with the `Dorm.Application` namespace
// when both are reachable in scope.
using AppApplication = Dorm.Domain.Entities.Application;

namespace Dorm.Application.Abstractions;

/// <summary>
/// Abstraction over EF Core's <c>AppDbContext</c> so Application services can do
/// LINQ/SaveChanges without taking a hard dependency on Dorm.Infrastructure.
/// </summary>
public interface IAppDbContext
{
    DbSet<User> Users { get; }
    DbSet<RefreshToken> RefreshTokens { get; }
    DbSet<StudentProfile> StudentProfiles { get; }
    DbSet<QuizAnswer> QuizAnswers { get; }
    DbSet<Apartment> Apartments { get; }
    DbSet<ApartmentAmenity> ApartmentAmenities { get; }
    DbSet<ApartmentPhoto> ApartmentPhotos { get; }
    DbSet<Tenancy> Tenancies { get; }
    DbSet<AppApplication> Applications { get; }
    DbSet<Conversation> Conversations { get; }
    DbSet<Message> Messages { get; }
    DbSet<Rating> Ratings { get; }
    DbSet<SavedListing> SavedListings { get; }
    DbSet<Report> Reports { get; }
    DbSet<Payment> Payments { get; }
    DbSet<Notification> Notifications { get; }
    DbSet<Testimonial> Testimonials { get; }

    Task<int> SaveChangesAsync(CancellationToken ct = default);
}
