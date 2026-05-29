using Dorm.Application.DTOs.Auth;

namespace Dorm.Application.Services.Auth;

public interface IAuthService
{
    Task<AuthResponse> RegisterAsync(RegisterRequest req, CancellationToken ct);
    Task<AuthResponse> LoginAsync(LoginRequest req, CancellationToken ct);
    Task<AuthResponse> RefreshAsync(RefreshRequest req, CancellationToken ct);

    Task VerifyEmailAsync(string token, CancellationToken ct);

    Task ForgotPasswordAsync(ForgotPasswordRequest req, CancellationToken ct);
    Task ResetPasswordAsync(ResetPasswordRequest req, CancellationToken ct);

    Task RequestUniversityVerificationAsync(Guid userId, VerifyUniversityRequest req, CancellationToken ct);
    Task ConfirmUniversityVerificationAsync(string token, CancellationToken ct);

    Task<UserDto> GetCurrentUserAsync(Guid userId, CancellationToken ct);
    Task<UserDto> UpdateProfileAsync(Guid userId, UpdateProfileRequest req, CancellationToken ct);
}
