namespace Dorm.Application.DTOs.Applications;

public sealed record MoveInChecklistDto(
    bool ApplicationAccepted,
    bool CommissionPaid,
    bool OwnerContacted,
    bool OwnerContactShared,
    DateTime? PlannedMoveInDate,
    bool MovedIn,
    bool ExperienceRated,
    int CompletedSteps,
    int TotalSteps);
