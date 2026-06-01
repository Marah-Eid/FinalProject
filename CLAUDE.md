# Dorm — Project Guide for Claude Code

> This file is Claude Code's memory across turns. Keep it updated as work progresses.
> Single source of truth for the spec is `docs/BUILD_BRIEF.md` — when in doubt, read it.

---

## 1. What we're building

**Dorm** — an English-only ASP.NET Core MVC web app that helps Jordanian
university students find apartments near campus and get matched with compatible roommates
via a weighted lifestyle quiz. Three user roles: **Student**, **Owner**, **Admin**.
The frontend is server-rendered Razor views (no separate SPA).

Core flow that must work flawlessly even if peripheral features slip:

> signup → quiz → browse → see match score → apply → get accepted

---

## 2. Tech stack & versions

### Backend (`backend/`)

| Component | Version pinned | Notes |
|---|---|---|
| .NET SDK | **9.0** — target `net9.0` | |
| Solution format | **`Dorm.slnx`** (XML) | Use `dotnet build backend/Dorm.slnx`. |
| Serilog.AspNetCore | `10.0.0` | Console + rolling file sink (transitive). |
| Swashbuckle.AspNetCore | | Swagger UI at `/swagger`, JSON at `/swagger/v1/swagger.json`. |
| EF Core + SqlServer provider | `9.0.x` | `Microsoft.EntityFrameworkCore.SqlServer`. |
| AutoMapper | `^13.0.x` | DTOs ↔ entities. |
| FluentValidation + DI extensions | `^11.10.x` | `FluentValidation.DependencyInjectionExtensions`. |
| BCrypt.Net-Next | `^4.0.x` | Password hashing. |
| Microsoft.AspNetCore.Authentication.JwtBearer | `^9.0.x` | |
| xUnit | (from template) | |
| FluentAssertions | `8.10.0` | Test assertions. |

Database: **SQL Server (LocalDB)** — connection string `Server=(localdb)\MSSQLLocalDB;Database=dorm;Trusted_Connection=True`. Local dev credentials are configured directly in `backend/Dorm.API/appsettings.json` (the user maintains this; do NOT echo or commit a replacement that hardcodes new credentials).

### Frontend — MVC Razor Views (no separate SPA)

The frontend is **server-rendered Razor views** inside `Dorm.API/Views/`. No React, no Vite, no Node.js.

| Component | Notes |
|---|---|
| Bootstrap 5.3.3 | CDN-linked in layouts. |
| Bootstrap Icons 1.11.3 | CDN-linked. |
| Leaflet 1.9.4 | CDN-linked for maps (Browse, Apartment Detail, New Listing). |
| Inter font | Google Fonts CDN. |
| Client-side JS | Vanilla JS in `@section Scripts` blocks + `wwwroot/js/` utilities (`auth.js`, `api.js`, `utils.js`). |

Four layouts: `_PublicLayout.cshtml` (landing/about/contact), `_BrowseLayout.cshtml` (browse/detail/payments), `_DashboardLayout.cshtml` (sidebar dashboard pages), `_AuthLayout.cshtml` (login/register).

Client-side auth via JWT stored in localStorage (`auth.js`). API calls via `api.js` wrapper (`api.get`, `api.post`, `api.put`, `api.delete`). Enums serialize as **integers** in JSON (no `JsonStringEnumConverter`).

---

## 3. Folder structure

```
FinalProject/                           ← repo root
├── CLAUDE.md
├── README.md
├── .gitignore
├── backend/
│   ├── .env.example
│   ├── Dorm.slnx
│   ├── Dorm.API/
│   │   ├── Controllers/                ← MVC page controllers + Api/ controllers
│   │   ├── Views/                      ← Razor views (Account, Admin, Apartment, Browse, Chat, Dashboard, etc.)
│   │   │   └── Shared/                 ← _PublicLayout, _BrowseLayout, _DashboardLayout, _AuthLayout
│   │   ├── wwwroot/
│   │   │   ├── css/                    ← dorm-public.css, dorm-dashboard.css, dorm-auth.css
│   │   │   ├── js/                     ← auth.js, api.js, utils.js
│   │   │   ├── uploads/                ← user-uploaded photos (served via UseStaticFiles)
│   │   │   └── property/               ← Property template assets (landing page)
│   │   └── Program.cs
│   ├── Dorm.Application/               ← DTOs, Services, Validators, Mapping, Abstractions
│   ├── Dorm.Domain/                    ← Entities, Enums
│   ├── Dorm.Infrastructure/            ← DbContext, Migrations, Identity, Storage, Payments, Email, Seed
│   └── tests/
│       └── Dorm.Application.Tests/
```

---

## 4. Build & run commands

> Working directory for these commands is the repo root (`marah/`) unless noted.

### Prerequisites
1. SQL Server (LocalDB) available — ships with Visual Studio. The `DatabaseBootstrap` auto-creates the `dorm` database on startup.
2. Copy `backend/.env.example` → `backend/.env` and fill in `ConnectionStrings__Default`, `Jwt__Secret`, etc.

### Backend (also serves the frontend)
```powershell
# Restore + build the whole solution
dotnet restore backend/Dorm.slnx
dotnet build  backend/Dorm.slnx

# Apply EF migrations
dotnet ef database update --project backend/Dorm.Infrastructure --startup-project backend/Dorm.API

# Run (Swagger at http://localhost:5080/swagger, site at http://localhost:5080)
dotnet run --project backend/Dorm.API

# Add a new migration
dotnet ef migrations add <Name> --project backend/Dorm.Infrastructure --startup-project backend/Dorm.API

# Tests (compatibility algorithm)
dotnet test backend/Dorm.slnx

# Seed demo data (idempotent)
$env:Dorm__Seed = "true"; dotnet run --project backend/Dorm.API

# Seed accounts:
#   admin@dorm.jo                / Admin123!
#   *.owner.seed@dorm.jo         / Owner123!
#   student*.seed@*.edu.jo       / Student123!
```

---

## 5. Non-negotiable rules

These are the rules the brief makes easy to get wrong. They override anything else.

### 5.1 Compatibility algorithm is the heart of the app
- Service: `CompatibilityService.CalculateScore(studentQuizAnswers, tenantsQuizAnswers)`.
- Per-question weights (sum = 100):

  | Question | Weight |
  |---|---|
  | Smoking | 25 |
  | Cleanliness | 20 |
  | SleepSchedule | 15 |
  | PetTolerance | 10 |
  | StudyHabits | 10 |
  | Guests | 8 |
  | SocialStyle | 7 |
  | Cooking | 5 |

- Pairwise score per question: **same → full weight**, **adjacent/compatible → half weight**, **opposite → 0**.
- Apartment score = **average** of pairwise scores vs each current tenant.
- **No current tenants → return 100%.**
- Return rounded integer percentage + per-question breakdown (matched-on / differed-on lists).
- **Write xUnit tests**: identical answers, all opposites, half-weight cases, no-tenants, averaging across tenants, rounding.

### 5.2 Gender — NOT in the quiz, NOT a browse filter
- Student gender (Male/Female) collected at signup only.
- Owner picks apartment `GenderType` (MaleOnly / FemaleOnly / Mixed). **Default = single-gender.**
- **API-level filter**: male student sees `MaleOnly + Mixed`; female student sees `FemaleOnly + Mixed`. The backend must never return mismatched apartments — not even on direct `GET /api/apartments/{id}` (return 404 if mismatched).

### 5.3 Religion / observance — REMOVED
- Not in quiz, not in filters, not in profile, not in listings. Skip everywhere.

### 5.4 Privacy
- `AddressDetail` (street-level) and owner `PhoneNumber` hidden until the requesting student has an **Accepted** application for that apartment. Otherwise return neighborhood-only.
- On apartment detail page's "current tenants" section: show **first name + year + major only** — **no profile photos**.
- Map pin on apartment detail is neighborhood-level (jitter lat/lng or snap to neighborhood centroid).

### 5.5 Payments are mocked
- `IPaymentService` interface in `Dorm.Application/Abstractions/`.
- `MockPaymentService` in `Dorm.Infrastructure/Payments/` returns success after ~1s.
- Payment types & amounts: **MatchCommission 15 JOD**, **ListingFee 10 JOD** (first listing free, subsequent require fee), **VerifiedBadge 2 JOD/month**.

### 5.6 English only — no RTL
- The MVC redesign is **English only**. No i18next, no Arabic locales, no RTL CSS.
- All dead RTL CSS rules have been removed from `dorm-public.css`, `dorm-dashboard.css`, `dorm-auth.css`.
- Font: Inter (Google Fonts CDN).

### 5.7 Architecture rules
- DTOs everywhere — controllers never accept/return EF entities. AutoMapper profiles in `Dorm.Application/Mapping/`.
- Global exception middleware → consistent error envelope `{ error: { code, message, details? } }`.
- Serilog structured logs (request id, user id, route).
- File storage behind `IFileStorage` so we can swap local → Cloudinary/Azure Blob without touching controllers.

### 5.8 Quality bar
- FluentValidation on every command/request DTO (backend); client-side validation in vanilla JS.
- Every list page: **designed empty state** + spinners + clear error states.
- Mobile-first responsive via Bootstrap 5 grid.
- Design tokens: primary `#F97316`, dark slate `#0f172a`/`#1e293b`, muted `#64748b`/`#94a3b8`, Inter font, Bootstrap 5 CDN.

### 5.9 Executing actions safely
- Initialize git locally, commit each phase. Do NOT push to a remote unless the user asks.
- No `git push --force`, no `--no-verify`, no destructive ops without explicit user approval.
- Never invent features that contradict the brief.

---

## 6. Domain quick reference

**Cities**: Amman, Irbid, Zarqa.
**Universities (University enum)**: JU, GJU, PSUT, YU, HU, MU, ZU, BAU, JUST, AAU, AABU, UOP, MEU, ASU (14 total).
**University email domains for verified badge**: `@ju.edu.jo`, `@gju.edu.jo`, `@psut.edu.jo`, `@yu.edu.jo`, similar.
**Amenities**: WiFi, AC, Heating, WashingMachine, Parking, Furnished, Elevator, Balcony, Kitchen, PrivateBathroom.
**House rules**: SmokingRule (Yes/No/Outside), GuestsRule (Yes/No/Limited).
**Quiz question keys** (enum): SleepSchedule, Cleanliness, Smoking, StudyHabits, SocialStyle, Guests, Cooking, PetTolerance.

**Adjacency map** (used by half-weight scoring) — to be defined precisely in the `CompatibilityService` and exercised by tests:
- SleepSchedule: `Flexible` adjacent to both `EarlyBird` and `NightOwl`; `EarlyBird` ↔ `NightOwl` opposite.
- Cleanliness: `Average` adjacent to `VeryTidy` and `Relaxed`; `VeryTidy` ↔ `Relaxed` opposite.
- Smoking: `Outside` adjacent to `No` (and weakly to `Yes`); `Yes` ↔ `No` opposite. (Final mapping decided in Phase 5 and documented in the test file.)
- Study: `Library` adjacent to both `QuietAtHome` and `GroupAtHome`; `QuietAtHome` ↔ `GroupAtHome` opposite.
- Social: `Balanced` adjacent to `Introvert` and `Extrovert`; `Introvert` ↔ `Extrovert` opposite.
- Guests: `Sometimes` adjacent to `Often` and `Rarely`; `Often` ↔ `Rarely` opposite.
- Cooking: `CookSometimes` adjacent to `CookALot` and `MostlyEatOut`; ends opposite.
- Pets: `Tolerate` adjacent to `LovePets` and `PreferNoPets`; ends opposite.

---

## 7. Phase checklist

- [x] **Phases 0–12 — Original SPA build** (backend API + React/Vite frontend — now superseded by MVC redesign)
- [x] **MVC Redesign** — Replaced the React SPA with server-rendered Razor views. All pages now live in `Dorm.API/Views/`. Four layouts (`_PublicLayout`, `_BrowseLayout`, `_DashboardLayout`, `_AuthLayout`). Client-side auth via `auth.js` (JWT in localStorage). API calls via `api.js`. Bootstrap 5 + Bootstrap Icons CDN. Leaflet CDN for maps. DB migrated from PostgreSQL to SQL Server (LocalDB). .NET target changed from `net10.0` to `net9.0`. Bilingual/RTL removed (English only). `IsFeatured`/`FeaturedUntil` dead code removed (entity, DTOs, service, seeder, DB columns). Payment type renamed from `FeaturedListing` to `ListingFee` (10 JOD, first listing free). Owner ratings wired to real DB queries. Listing fee payment flow added to New Listing page.
- [x] **Bug fix audit** — Fixed GUID quoting in onclick handlers, photo URL field names, amenity enum integer keys, date field name in StudentApps, dead RTL CSS removal, Edit Profile sidebar link added.

---

## 8. Working agreements

- After changes: build backend, smoke-test, then commit. Do not move on until the slice runs.
- When stuck on a peripheral feature, **prioritize the core flow** (signup → quiz → browse → score → apply → accepted) over admin/ratings completeness.
- Keep this file updated — tick checklist items, adjust versions as pinned, append decisions.
- Stop and confirm with the user before any irreversible action beyond local file edits and local commits.
