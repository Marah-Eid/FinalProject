using Dorm.Application.Common;
using Dorm.Application.DTOs.Apartments;
using Dorm.Application.DTOs.Compatibility;

namespace Dorm.Application.Services.Apartments;

public interface IApartmentService
{
    Task<PaginatedResult<ApartmentListItemDto>> GetListAsync(ApartmentListQuery query, CancellationToken ct);

    /// <summary>
    /// Every apartment owned by <paramref name="ownerId"/>, including inactive
    /// and suspended ones — used by the owner's "My listings" page.
    /// </summary>
    Task<IReadOnlyList<ApartmentListItemDto>> GetMineAsync(Guid ownerId, CancellationToken ct);

    /// <summary>Throws NotFound if the listing doesn't exist OR the gender filter excludes it.</summary>
    Task<ApartmentDetailDto> GetByIdAsync(Guid id, CancellationToken ct);

    /// <summary>
    /// Compatibility breakdown for the requesting student against the apartment's
    /// current tenants. The controller enforces the student-only policy.
    /// </summary>
    Task<CompatibilityBreakdownDto> GetCompatibilityForStudentAsync(
        Guid apartmentId, Guid studentUserId, CancellationToken ct);

    Task<ApartmentDetailDto> CreateAsync(Guid ownerId, CreateApartmentRequest req, CancellationToken ct);

    Task<ApartmentDetailDto> UpdateAsync(Guid id, Guid ownerId, UpdateApartmentRequest req, CancellationToken ct);

    Task DeleteAsync(Guid id, Guid ownerId, CancellationToken ct);

    Task<ApartmentPhotoDto> UploadPhotoAsync(
        Guid apartmentId, Guid ownerId,
        Stream content, string fileName, string contentType,
        CancellationToken ct);

    Task DeletePhotoAsync(Guid apartmentId, Guid photoId, Guid ownerId, CancellationToken ct);
}
