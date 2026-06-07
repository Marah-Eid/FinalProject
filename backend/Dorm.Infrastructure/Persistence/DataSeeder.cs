using Dorm.Application.Common;
using Dorm.Domain.Entities;
using Dorm.Domain.Enums;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using AppApplication = Dorm.Domain.Entities.Application;

namespace Dorm.Infrastructure.Persistence;

/// <summary>
/// Phase 12 seed: 20 students with completed quizzes, 10 owners, 30 apartments
/// across Amman/Irbid/Zarqa, a handful of active tenancies, pending applications,
/// sample ratings + messages.
///
/// Triggered by setting <c>Dorm__Seed=true</c> in the environment (or
/// <c>"Seed": true</c> in appsettings). Idempotent — re-running with seed
/// already populated is a no-op. Every seeded record uses a recognisable
/// "+seed" email suffix so it never collides with real signups.
/// </summary>
public static class DataSeeder
{
    private const string SeedMarkerEmail = "student01.seed@ju.edu.jo";

    /// <summary>Run the seed if the marker user is missing. Otherwise log + skip.</summary>
    public static async Task RunAsync(IServiceProvider services, CancellationToken ct = default)
    {
        var logger = services.GetRequiredService<ILoggerFactory>().CreateLogger(nameof(DataSeeder));
        var db = services.GetRequiredService<AppDbContext>();
        var userManager = services.GetRequiredService<UserManager<User>>();

        var alreadySeeded = await db.Users.AsNoTracking().AnyAsync(u => u.Email == SeedMarkerEmail, ct);
        if (alreadySeeded)
        {
            logger.LogInformation("[SEED] Marker user found — skipping data seed.");
            return;
        }

        logger.LogInformation("[SEED] Starting full demo-data seed…");

        var rng = new Random(19092002);  // deterministic seed for reproducible demos

        // ── Owners ─────────────────────────────────────────────────────────
        var owners = BuildOwners();
        foreach (var o in owners)
            await userManager.CreateAsync(o, "Owner123!");

        // ── Students ───────────────────────────────────────────────────────
        var students = BuildStudents();
        foreach (var s in students)
            await userManager.CreateAsync(s, "Student123!");

        // ── Student profiles + quiz answers (all 20 students completed) ────
        foreach (var s in students)
        {
            var profile = new StudentProfile
            {
                Id = Guid.NewGuid(),
                UserId = s.Id,
                Year = 1 + (rng.Next() % 5),
                Major = PickMajor(rng),
                Bio = null,
                QuizCompleted = true,
            };
            db.StudentProfiles.Add(profile);
            foreach (var qa in BuildQuizAnswers(profile.Id, rng))
                db.QuizAnswers.Add(qa);
        }

        // ── Apartments (30) ────────────────────────────────────────────────
        var apartments = BuildApartments(owners, rng);
        db.Apartments.AddRange(apartments);
        foreach (var apt in apartments)
        {
            // amenities — a random 3–6 from the catalogue
            var amenityPool = Enum.GetValues<AmenityType>();
            var picked = amenityPool.OrderBy(_ => rng.Next()).Take(3 + rng.Next(4)).Distinct().ToArray();
            foreach (var am in picked)
            {
                db.ApartmentAmenities.Add(new ApartmentAmenity
                {
                    Id = Guid.NewGuid(),
                    ApartmentId = apt.Id,
                    AmenityType = am,
                });
            }
        }

        // ── Apartment photos (3 themed per apartment) ─────────────────────
        // Photos grouped by theme so each apartment's gallery looks coherent:
        // Group 0: modern living rooms (1-3), Group 1: bedrooms (4-6),
        // Group 2: kitchens (7-9), Group 3: furnished (10-12),
        // Group 4: exteriors (13-15), Group 5: cozy (16-18), Group 6: minimal (19-20+1)
        var photoGroups = new[]
        {
            new[] { 1, 2, 3 },   // modern living rooms
            new[] { 4, 5, 6 },   // bedrooms
            new[] { 7, 8, 9 },   // kitchens
            new[] { 10, 11, 12 },// furnished apartments
            new[] { 13, 14, 15 },// apartment exteriors
            new[] { 16, 17, 18 },// cozy interiors
            new[] { 19, 20, 1 }, // minimal rooms + living
            new[] { 2, 5, 8 },   // mix: living + bed + kitchen
            new[] { 3, 6, 9 },   // mix: living + bed + kitchen
            new[] { 10, 14, 17 },// mix: furnished + ext + cozy
        };
        for (var a = 0; a < apartments.Count; a++)
        {
            var group = photoGroups[a % photoGroups.Length];
            for (var p = 0; p < group.Length; p++)
            {
                db.ApartmentPhotos.Add(new ApartmentPhoto
                {
                    Id = Guid.NewGuid(),
                    ApartmentId = apartments[a].Id,
                    PhotoUrl = $"/uploads/apartments/seed-{group[p]:D2}.jpg",
                    DisplayOrder = p,
                });
            }
        }

        // Persist users+apartments first so FKs are valid when we add tenancies/applications/messages.
        await db.SaveChangesAsync(ct);

        // ── Tenancies (active) ─────────────────────────────────────────────
        // Pick the first 6 apartments and place a student into each (decrementing AvailableSpots).
        var tenancyApartments = apartments
            .Where(a => a.GenderType != GenderType.Mixed)  // single-gender first for cleanest match
            .Take(8)
            .Concat(apartments.Where(a => a.GenderType == GenderType.Mixed).Take(2))
            .Take(10)
            .ToList();

        var usedStudents = new HashSet<Guid>();
        foreach (var apt in tenancyApartments)
        {
            var fit = students
                .Where(s => !usedStudents.Contains(s.Id) && PassesGender(apt.GenderType, s.Gender))
                .FirstOrDefault();
            if (fit is null) continue;

            db.Tenancies.Add(new Tenancy
            {
                Id = Guid.NewGuid(),
                ApartmentId = apt.Id,
                StudentId = fit.Id,
                StartDate = DateTime.UtcNow.AddDays(-rng.Next(30, 200)),
                EndDate = null,
                Status = TenancyStatus.Active,
            });
            apt.AvailableSpots = Math.Max(0, apt.AvailableSpots - 1);
            usedStudents.Add(fit.Id);
        }

        // ── Pending applications (8) ───────────────────────────────────────
        var applicants = students.Where(s => !usedStudents.Contains(s.Id)).Take(8).ToList();
        var availableApts = apartments.Where(a => a.AvailableSpots > 0).ToList();
        for (var i = 0; i < applicants.Count && i < availableApts.Count; i++)
        {
            var student = applicants[i];
            var apt = availableApts.FirstOrDefault(a => PassesGender(a.GenderType, student.Gender) && a.AvailableSpots > 0);
            if (apt is null) continue;

            db.Applications.Add(new AppApplication
            {
                Id = Guid.NewGuid(),
                ApartmentId = apt.Id,
                StudentId = student.Id,
                Message = "Hi! I'm interested in this apartment — I think we'd be a good fit. Looking forward to hearing back.",
                CompatibilityScore = 50 + rng.Next(50),  // 50-99 placeholder; real values get computed by ApplicationService.Apply
                Status = ApplicationStatus.Pending,
                CreatedAt = DateTime.UtcNow.AddDays(-rng.Next(0, 14)),
            });
        }

        // ── Conversations + messages (4 conversations) ─────────────────────
        // Build one conversation per first 4 tenancy apartments.
        var tenancies = db.Tenancies.Local.Take(4).ToList();
        foreach (var t in tenancies)
        {
            var conv = new Conversation
            {
                Id = Guid.NewGuid(),
                Participant1Id = t.StudentId,
                Participant2Id = apartments.First(a => a.Id == t.ApartmentId).OwnerId,
                ApartmentId = t.ApartmentId,
                LastMessageAt = DateTime.UtcNow.AddDays(-rng.Next(0, 7)),
            };
            db.Conversations.Add(conv);

            // 2–4 alternating messages.
            var msgCount = 2 + rng.Next(3);
            var baseTime = conv.LastMessageAt.AddMinutes(-msgCount * 30);
            for (var m = 0; m < msgCount; m++)
            {
                db.Messages.Add(new Message
                {
                    Id = Guid.NewGuid(),
                    ConversationId = conv.Id,
                    SenderId = m % 2 == 0 ? conv.Participant1Id : conv.Participant2Id,
                    Content = SampleMessage(m, rng),
                    IsRead = m < msgCount - 1,  // last one unread
                    SentAt = baseTime.AddMinutes(m * 30),
                });
            }
        }

        // ── Ratings (2 — needs ended tenancies; we'll end one tenancy retroactively) ───
        var firstTenancy = db.Tenancies.Local.First();
        firstTenancy.Status = TenancyStatus.Ended;
        firstTenancy.EndDate = DateTime.UtcNow.AddDays(-2);
        // Bump the spot back up since the tenancy is ended.
        apartments.First(a => a.Id == firstTenancy.ApartmentId).AvailableSpots += 1;

        var rentedApt = apartments.First(a => a.Id == firstTenancy.ApartmentId);
        db.Ratings.Add(new Rating
        {
            Id = Guid.NewGuid(),
            RaterId = firstTenancy.StudentId,        // student rating the owner
            RatedUserId = rentedApt.OwnerId,
            ApartmentId = firstTenancy.ApartmentId,
            Stars = 5,
            Comment = "Great owner, super responsive. Place was as advertised.",
            CreatedAt = DateTime.UtcNow.AddDays(-1),
        });
        db.Ratings.Add(new Rating
        {
            Id = Guid.NewGuid(),
            RaterId = rentedApt.OwnerId,             // owner rating the student
            RatedUserId = firstTenancy.StudentId,
            ApartmentId = firstTenancy.ApartmentId,
            Stars = 5,
            Comment = "Quiet, tidy, paid on time. Would rent to again.",
            CreatedAt = DateTime.UtcNow.AddDays(-1),
        });

        // ── Testimonials (pre-approved) ──────────────────────────────────
        var testimonialData = new (int StudentIdx, int Stars, string Text)[]
        {
            (0, 5, "Dorm made finding a roommate so easy. The compatibility quiz matched me with someone who has the same study habits and sleep schedule — we get along great!"),
            (1, 5, "I was worried about finding a place near JU as a female student. Dorm's gender filter meant I only saw female-only apartments, and the match score helped me pick the best one."),
            (2, 4, "Really useful platform. Found a furnished apartment near GJU within a week. The only thing I'd love is a mobile app for easier browsing on the go."),
            (5, 5, "The quiz feature is genius. I matched 92% with my current roommate and we've become good friends. Highly recommend Dorm to any student in Jordan."),
            (7, 4, "As a Yarmouk student in Irbid, options were limited before Dorm. Now I can see exactly what's available near campus with real prices and walking distances."),
        };
        var ownerTestimonials = new (int OwnerIdx, int Stars, string Text)[]
        {
            (0, 5, "Great platform for listing apartments. I filled all my spots within two weeks. The application system with compatibility scores helps me pick tenants who'll get along."),
        };
        foreach (var t in testimonialData)
        {
            db.Testimonials.Add(new Testimonial
            {
                Id = Guid.NewGuid(),
                UserId = students[t.StudentIdx].Id,
                Stars = t.Stars,
                Text = t.Text,
                IsApproved = true,
                CreatedAt = DateTime.UtcNow.AddDays(-rng.Next(5, 60)),
            });
        }
        foreach (var t in ownerTestimonials)
        {
            db.Testimonials.Add(new Testimonial
            {
                Id = Guid.NewGuid(),
                UserId = owners[t.OwnerIdx].Id,
                Stars = t.Stars,
                Text = t.Text,
                IsApproved = true,
                CreatedAt = DateTime.UtcNow.AddDays(-rng.Next(5, 60)),
            });
        }

        await db.SaveChangesAsync(ct);

        logger.LogInformation(
            "[SEED] Done. Inserted {Owners} owners, {Students} students, {Apts} apartments, " +
            "{Ten} tenancies, {Apps} applications, {Conv} conversations, 2 ratings, {Testi} testimonials.",
            owners.Count, students.Count, apartments.Count,
            db.Tenancies.Local.Count,
            db.Applications.Local.Count,
            db.Conversations.Local.Count,
            testimonialData.Length + ownerTestimonials.Length);
    }

    // ─── builders ───────────────────────────────────────────────────────────

    private static bool PassesGender(GenderType apt, Gender student) =>
        apt == GenderType.Mixed
        || (apt == GenderType.MaleOnly && student == Gender.Male)
        || (apt == GenderType.FemaleOnly && student == Gender.Female);

    private static List<User> BuildOwners()
    {
        var seedOwners = new (string FullName, string Email, Gender Gender)[]
        {
            ("Ahmad Al-Khalil",   "ahmad.owner.seed@dorm.jo",   Gender.Male),
            ("Faisal Hammadi",    "faisal.owner.seed@dorm.jo",  Gender.Male),
            ("Rania Al-Bashir",   "rania.owner.seed@dorm.jo",   Gender.Female),
            ("Yousef Saadeh",     "yousef.owner.seed@dorm.jo",  Gender.Male),
            ("Hanan Mansour",     "hanan.owner.seed@dorm.jo",   Gender.Female),
            ("Khaled Abu-Salim",  "khaled.owner.seed@dorm.jo",  Gender.Male),
            ("Maha Al-Rashid",    "maha.owner.seed@dorm.jo",    Gender.Female),
            ("Tariq Al-Zoubi",    "tariq.owner.seed@dorm.jo",   Gender.Male),
            ("Nadine Bisharat",   "nadine.owner.seed@dorm.jo",  Gender.Female),
            ("Bassam Al-Najjar",  "bassam.owner.seed@dorm.jo",  Gender.Male),
        };

        return seedOwners.Select(o => new User
        {
            Id = Guid.NewGuid(),
            FullName = o.FullName,
            Email = o.Email,
            UserName = o.Email,
            PhoneNumber = $"+9627{Random.Shared.Next(10000000, 99999999)}",
            Role = UserRole.Owner,
            Gender = o.Gender,
            IsEmailVerified = true,
            IsUniversityVerified = false,
            CreatedAt = DateTime.UtcNow.AddDays(-Random.Shared.Next(60, 720)),
        }).ToList();
    }

    private static List<User> BuildStudents()
    {
        var seedStudents = new (string Name, string EmailLocal, string Domain, Gender Gender, University? University)[]
        {
            ("Omar Khaled",     "student01.seed", "ju.edu.jo",   Gender.Male,   University.JU),
            ("Lina Ahmad",      "student02.seed", "ju.edu.jo",   Gender.Female, University.JU),
            ("Faris Saleem",    "student03.seed", "gju.edu.jo",  Gender.Male,   University.GJU),
            ("Sara Mansoor",    "student04.seed", "gju.edu.jo",  Gender.Female, University.GJU),
            ("Hamza Younes",    "student05.seed", "psut.edu.jo", Gender.Male,   University.PSUT),
            ("Reem Daher",      "student06.seed", "psut.edu.jo", Gender.Female, University.PSUT),
            ("Ziad Bakri",      "student07.seed", "yu.edu.jo",   Gender.Male,   University.YU),
            ("Yasmin Tarawneh", "student08.seed", "yu.edu.jo",   Gender.Female, University.YU),
            ("Mohammed Hijazi", "student09.seed", "hu.edu.jo",   Gender.Male,   University.HU),
            ("Nour Khoury",     "student10.seed", "hu.edu.jo",   Gender.Female, University.HU),
            ("Saif Al-Atrash",  "student11.seed", "mutah.edu.jo",Gender.Male,   University.MU),
            ("Aya Awad",        "student12.seed", "zu.edu.jo",   Gender.Female, University.ZU),
            ("Hassan Qudah",    "student13.seed", "bau.edu.jo",  Gender.Male,   University.BAU),
            ("Dana Khoury",     "student14.seed", "just.edu.jo", Gender.Female, University.JUST),
            ("Ibrahim Hadid",   "student15.seed", "ju.edu.jo",   Gender.Male,   University.JU),
            ("Maya Saadeh",     "student16.seed", "psut.edu.jo", Gender.Female, University.PSUT),
            ("Adam Saleh",      "student17.seed", "gju.edu.jo",  Gender.Male,   University.GJU),
            ("Tala Naber",      "student18.seed", "yu.edu.jo",   Gender.Female, University.YU),
            ("Karim Hawash",    "student19.seed", "aau.edu.jo",  Gender.Male,   University.AAU),
            ("Layla Touqan",    "student20.seed", "hu.edu.jo",   Gender.Female, University.HU),
        };

        return seedStudents.Select((s, i) =>
        {
            var email = $"{s.EmailLocal}@{s.Domain}";
            return new User
            {
                Id = Guid.NewGuid(),
                FullName = s.Name,
                Email = email,
                UserName = email,
                PhoneNumber = $"+9627{77 + i:D2}{Random.Shared.Next(100000, 999999)}",
                Role = UserRole.Student,
                Gender = s.Gender,
                University = s.University,
                IsEmailVerified = true,
                IsUniversityVerified = s.Domain.EndsWith(".edu.jo"),
                CreatedAt = DateTime.UtcNow.AddDays(-Random.Shared.Next(7, 180)),
            };
        }).ToList();
    }

    private static IEnumerable<QuizAnswer> BuildQuizAnswers(Guid studentProfileId, Random rng)
    {
        foreach (var q in QuizAnswers.AllQuestions)
        {
            var options = QuizAnswers.ByQuestion[q];
            yield return new QuizAnswer
            {
                Id = Guid.NewGuid(),
                StudentProfileId = studentProfileId,
                QuestionKey = q,
                AnswerValue = options[rng.Next(options.Count)],
            };
        }
    }

    private static List<Apartment> BuildApartments(List<User> owners, Random rng)
    {
        // 30 apartments across cities. Layout: ~15 Amman, ~10 Irbid, ~5 Zarqa.
        var amman = new[]
        {
            ("Aljubaiha", 32.0166, 35.8696, University.JU),
            ("Sweileh",   32.0227, 35.8412, University.PSUT),
            ("Tla al-Ali",32.0010, 35.8666, University.GJU),
            ("Shmaisani", 31.9747, 35.8772, University.JU),
            ("Jabal Amman",31.9512,35.9239, University.JU),
            ("Khalda",    31.9926, 35.8431, University.JU),
            ("Marj Al-Hamam", 31.9189, 35.8362, University.JU),
            ("Abdoun",    31.9489, 35.8800, University.PSUT),
            ("Wadi Saqra",31.9576, 35.8826, University.JU),
            ("Abu Nseir", 32.0412, 35.8755, University.AAU),
        };
        var irbid = new[]
        {
            ("Hay Al-Andalus", 32.5532, 35.8479, University.YU),
            ("Hawwarah",       32.4885, 35.8493, University.JUST),
            ("Aydoun",         32.4742, 35.9069, University.YU),
            ("Al-Rabia",       32.5410, 35.8511, University.YU),
            ("Bayt Ras",       32.6071, 35.8702, University.YU),
        };
        var zarqa = new[]
        {
            ("Hay Al-Jabal",  32.0760, 36.0934, University.ZU),
            ("New Zarqa",     32.0552, 36.1080, University.ZU),
            ("Wadi Al-Hajar", 32.0823, 36.0653, University.ZU),
            ("Hashmi Shamali",32.1130, 36.0880, University.HU),
            ("Russeifa",      32.0290, 36.0480, University.HU),
        };

        var titlesEn = new[]
        {
            "Sunny 2-bedroom apartment near {U}",
            "Modern furnished flat — 10 min walk to {U}",
            "Quiet ground-floor apartment near {U}",
            "Spacious top-floor flat with balcony by {U}",
            "Cozy student room in shared apartment near {U}",
            "Recently renovated apartment near {U}",
            "Affordable shared rooms with fast WiFi by {U}",
            "Bright corner apartment with city views near {U}",
            "Fully furnished student flat near {U} campus",
            "Comfortable shared apartment beside {U}",
        };
        var descs = new[]
        {
            "Spacious, well-lit apartment with modern furniture and everything you need for a productive semester. Walking distance to campus, close to supermarkets and public transit. Shared kitchen with full appliances and a cozy living room.",
            "Recently renovated with brand-new furniture, fresh paint, and modern fixtures. Great natural light through large windows and a small balcony overlooking the neighborhood. Fast WiFi included in the rent.",
            "Located on a quiet residential street with friendly neighbors. Just a 5-minute walk to the campus gate, with a bakery and minimarket on the corner. Ideal for students who prefer a calm study environment.",
            "Open-plan kitchen with granite countertops, plenty of closet storage, and a shared lounge with a TV. Utilities are split evenly among tenants — typically 15–25 JOD each per month. Building has a secure entrance and intercom.",
            "Family-owned building with a welcoming atmosphere. Secure entrance with camera system, dedicated on-site parking, and a rooftop terrace for studying or relaxing. High-speed fiber internet included.",
            "Third-floor apartment with tiled floors and central heating. Two shared bathrooms, a large kitchen, and a washing machine. The building is right next to the main bus line to campus.",
            "Freshly painted with new mattresses and desks in every room. The apartment gets excellent morning light and stays cool in summer thanks to thick stone walls. Grocery stores and restaurants within walking distance.",
            "Corner unit with windows on two sides for cross-ventilation and panoramic neighborhood views. Furnished with quality beds, wardrobes, and study desks. The landlord is responsive and handles maintenance quickly.",
        };

        var list = new List<Apartment>();

        void Add(string city, (string neighborhood, double lat, double lng, University uni) where, int count)
        {
            for (var i = 0; i < count; i++)
            {
                var owner = owners[rng.Next(owners.Count)];
                var totalSpots = 2 + rng.Next(3);            // 2..4
                var availableSpots = 1 + rng.Next(totalSpots); // 1..total
                var pricePerSpot = 80 + rng.Next(170);        // 80..250
                var fullRent = pricePerSpot * totalSpots;
                var gender = (GenderType)rng.Next(3);

                list.Add(new Apartment
                {
                    Id = Guid.NewGuid(),
                    OwnerId = owner.Id,
                    Title = titlesEn[rng.Next(titlesEn.Length)].Replace("{U}", FormatUni(where.uni)),
                    Description = descs[rng.Next(descs.Length)],
                    City = city switch
                    {
                        "Amman" => City.Amman,
                        "Irbid" => City.Irbid,
                        _ => City.Zarqa,
                    },
                    Neighborhood = where.neighborhood,
                    AddressDetail = $"Building {rng.Next(1, 99)}, floor {rng.Next(1, 5)}, near {where.neighborhood} main street",
                    Latitude = where.lat + (rng.NextDouble() - 0.5) * 0.01,
                    Longitude = where.lng + (rng.NextDouble() - 0.5) * 0.01,
                    FullRent = fullRent,
                    TotalSpots = totalSpots,
                    AvailableSpots = availableSpots,
                    GenderType = gender,
                    IsFurnished = rng.NextDouble() > 0.3,
                    NearestUniversity = where.uni,
                    DistanceRange = (DistanceRange)rng.Next(3),
                    SmokingRule = (SmokingRule)rng.Next(3),
                    GuestsRule = (GuestsRule)rng.Next(3),
                    IsActive = true,
                    IsSuspended = false,
                    CreatedAt = DateTime.UtcNow.AddDays(-rng.Next(1, 90)),
                });
            }
        }

        // Target counts: 15 Amman + 10 Irbid + 7 Zarqa = 32 total.
        foreach (var n in amman) Add("Amman", n, 1);                 // 10 Amman base
        foreach (var n in amman.Take(5)) Add("Amman", n, 1);          // +5 = 15 Amman
        foreach (var n in irbid) Add("Irbid", n, 2);                  // 5 × 2 = 10 Irbid
        foreach (var n in zarqa) Add("Zarqa", n, 1);                  // 5 Zarqa base
        Add("Zarqa", zarqa[3], 1);                                    // +1 HU
        Add("Zarqa", zarqa[4], 1);                                    // +1 HU = 7 Zarqa

        return list;
    }

    private static string FormatUni(University u) => u switch
    {
        University.JU => "the University of Jordan",
        University.GJU => "GJU",
        University.PSUT => "PSUT",
        University.YU => "Yarmouk",
        University.HU => "Hashemite University",
        University.MU => "Mutah",
        University.ZU => "Zarqa University",
        University.BAU => "Al-Balqa Applied University",
        University.JUST => "JUST",
        University.AAU => "Amman Arab University",
        _ => "campus",
    };

    private static string PickMajor(Random rng)
    {
        var majors = new[]
        {
            "Computer Science", "Software Engineering", "Civil Engineering",
            "Architecture", "Business Administration", "Marketing",
            "Accounting", "Pharmacy", "Medicine", "Dentistry",
            "Mechanical Engineering", "Electrical Engineering",
            "Translation", "English Literature", "Graphic Design",
            "Data Science", "Mathematics", "Physics", "Law", "Psychology",
        };
        return majors[rng.Next(majors.Length)];
    }

    private static string SampleMessage(int index, Random rng)
    {
        var openers = new[]
        {
            "Hi! Is the apartment still available?",
            "Hey, can I see it this weekend?",
            "Quick question — is parking included?",
            "Are the utilities part of the rent?",
            "What's the move-in date?",
        };
        var replies = new[]
        {
            "Yes, definitely available. Want to schedule a visit?",
            "Sure, Saturday afternoon works. I'll send the exact address once we confirm.",
            "Parking is street-only but usually easy to find.",
            "Utilities are split evenly among tenants — usually 15–25 JOD each.",
            "Move-in is flexible from the 1st of next month.",
        };
        return (index % 2 == 0 ? openers : replies)[rng.Next(5)];
    }
}
