namespace Dorm.Application.DTOs.Ratings;

public sealed record RatingDto(
    Guid Id,
    Guid RaterId,
    string RaterName,
    string? RaterProfilePhotoUrl,
    Guid ApartmentId,
    string ApartmentTitle,
    int Stars,
    string? Comment,
    DateTime CreatedAt);

public sealed record SubmitRatingRequest(
    Guid RatedUserId,
    Guid ApartmentId,
    int Stars,
    string? Comment);
