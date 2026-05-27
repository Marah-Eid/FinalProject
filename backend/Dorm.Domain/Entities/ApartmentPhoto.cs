namespace Dorm.Domain.Entities;

public class ApartmentPhoto
{
    public Guid Id { get; set; }
    public Guid ApartmentId { get; set; }
    public Apartment Apartment { get; set; } = null!;

    public required string PhotoUrl { get; set; }
    public int DisplayOrder { get; set; }
}
