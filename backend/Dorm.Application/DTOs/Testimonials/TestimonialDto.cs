namespace Dorm.Application.DTOs.Testimonials;

public sealed record TestimonialDto(
    Guid Id,
    string UserName,
    string? UserRole,
    int Stars,
    string Text,
    bool IsApproved,
    DateTime CreatedAt);

public sealed record CreateTestimonialRequest(string Text, int Stars);
