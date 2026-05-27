using Dorm.Application.DTOs.Applications;

namespace Dorm.Application.Services.Applications;

public interface IApplicationService
{
    Task<ApplicationDto> ApplyAsync(Guid studentId, Guid apartmentId, ApplyRequest req, CancellationToken ct);

    Task<IReadOnlyList<ApplicationDto>> GetMineAsync(Guid studentId, CancellationToken ct);

    Task<IReadOnlyList<ApplicationReceivedDto>> GetReceivedAsync(Guid ownerId, CancellationToken ct);

    Task<ApplicationDto> AcceptAsync(Guid applicationId, Guid ownerId, CancellationToken ct);

    Task<ApplicationDto> RejectAsync(Guid applicationId, Guid ownerId, CancellationToken ct);

    Task WithdrawAsync(Guid applicationId, Guid studentId, CancellationToken ct);
}
