namespace Dorm.Application.Abstractions;

public interface IUniversityEmailDetector
{
    /// <summary>True if the email's domain is a recognized Jordanian university (e.g. ju.edu.jo) or any *.edu.jo.</summary>
    bool IsUniversityEmail(string email);
}
