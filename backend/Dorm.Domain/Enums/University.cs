namespace Dorm.Domain.Enums;

/// <summary>
/// Jordanian universities supported in v1. Add more here when the seed/dropdown grows.
/// Codes intentionally short so they read well in URLs and slugs (e.g. /universities/ju).
/// </summary>
public enum University
{
    /// <summary>University of Jordan (ju.edu.jo).</summary>
    JU = 0,
    /// <summary>German-Jordanian University (gju.edu.jo).</summary>
    GJU = 1,
    /// <summary>Princess Sumaya University for Technology (psut.edu.jo).</summary>
    PSUT = 2,
    /// <summary>Yarmouk University (yu.edu.jo).</summary>
    YU = 3,
    /// <summary>Hashemite University (hu.edu.jo).</summary>
    HU = 4,
    /// <summary>Mutah University (mutah.edu.jo).</summary>
    MU = 5,
    /// <summary>Zarqa University (zu.edu.jo).</summary>
    ZU = 6,
    /// <summary>Al-Balqa Applied University (bau.edu.jo).</summary>
    BAU = 7,
    /// <summary>Jordan University of Science and Technology (just.edu.jo).</summary>
    JUST = 8,
    /// <summary>Amman Arab University (aau.edu.jo).</summary>
    AAU = 9,
}
