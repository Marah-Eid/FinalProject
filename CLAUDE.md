# Dorm — Project Guide for Claude Code

> This file is Claude Code's memory across turns. Keep it updated as work progresses.
> Single source of truth for the spec is `docs/BUILD_BRIEF.md` — when in doubt, read it.

---

## 1. What we're building

**Dorm** — a bilingual (Arabic-default, full RTL) full-stack web app that helps Jordanian
university students find apartments near campus and get matched with compatible roommates
via a weighted lifestyle quiz. Three user roles: **Student**, **Owner**, **Admin**.

Core flow that must work flawlessly even if peripheral features slip:

> signup → quiz → browse → see match score → apply → get accepted

---

## 2. Tech stack & versions

### Backend (`backend/`)

| Component | Version pinned | Notes |
|---|---|---|
| .NET SDK | **10.0.103** — target `net10.0` | LTS to Nov 2028. Do NOT use .NET 9. |
| Solution format | **`Dorm.slnx`** (XML, .NET 9+ default) | Supported by VS, Rider. Use `dotnet build backend/Dorm.slnx`. |
| Microsoft.AspNetCore.OpenApi | `10.0.3` (Phase 0; can prune later) | Came with template; not actively used — Swashbuckle drives Swagger. |
| Serilog.AspNetCore | `10.0.0` | Console + rolling file sink (transitive). |
| Swashbuckle.AspNetCore | `10.1.7` | Swagger UI at `/swagger`, JSON at `/swagger/v1/swagger.json`. |
| EF Core | `^10.0.x` (added in Phase 1) | |
| Npgsql.EntityFrameworkCore.PostgreSQL | `^10.0.x` (Phase 1) | Matches EF Core 10. |
| AutoMapper | `^13.0.x` (Phase 1) | DTOs ↔ entities. |
| FluentValidation + DI extensions | `^11.10.x` (Phase 1) | `FluentValidation.AspNetCore` is deprecated post-v10 — use `FluentValidation.DependencyInjectionExtensions`. |
| BCrypt.Net-Next | `^4.0.x` (Phase 1) | Password hashing. |
| Microsoft.AspNetCore.Authentication.JwtBearer | `^10.0.x` (Phase 1) | |
| xUnit | (from template) | |
| FluentAssertions | `8.10.0` | Test assertions. |

Database: **PostgreSQL 16+** running locally. `psql` is NOT on PATH but a server is listening on `localhost:5432` — local dev credentials are configured directly in `backend/Dorm.API/appsettings.json` (the user maintains this; do NOT echo or commit a replacement that hardcodes new credentials).

### Frontend (`frontend/`)

| Component | Version pinned | Notes |
|---|---|---|
| Node | **v20.20.2** | npm `10.8.2` |
| React / React DOM | `^19.2.6` | |
| Vite | `^8.0.12` | |
| TypeScript | `~6.0.2` | `tsconfig.app.json` has `verbatimModuleSyntax: true` — use `import type` for types. |
| Tailwind CSS | `^4.3.0` | **CSS-first config** in `src/styles/index.css`: `@import "tailwindcss"` + `@theme`. NO `tailwind.config.js`. |
| `@tailwindcss/vite` | `^4.3.0` | Plugin wired in `vite.config.ts`. |
| React Router | `^7.15.1` | Import from `react-router` (no `-dom` suffix in v7+). |
| @tanstack/react-query | `^5.100.14` | + `@tanstack/react-query-devtools` |
| Axios | `^1.16.1` | |
| Leaflet | `^1.9.4` + `react-leaflet` `^5.0.0` | `@types/leaflet` `^1.9.21` |
| i18next | `^26.2.0` + `react-i18next` `^17.0.8` + `i18next-browser-languagedetector` `^8.2.1` | |
| React Hook Form | `^7.76.1` + `@hookform/resolvers` `^5.4.0` | resolvers v5 supports Zod v4. |
| **Zod** | `^4.4.3` | **Note: v4** (not v3). API shifts vs v3: error shape, `z.string().email()` is now `z.email()`, etc. |
| lucide-react | `^1.16.0` | |

---

## 3. Folder structure

```
marah/                                  ← repo root (= the brief's "dorm/")
├── CLAUDE.md
├── README.md
├── .gitignore
├── .editorconfig
├── docs/
│   ├── BUILD_BRIEF.md                  ← source of truth
│   └── dorm-claude-code-prompts.md
├── backend/
│   ├── .env.example
│   ├── Dorm.sln
│   ├── Dorm.API/                       ← Controllers, Middleware, Program.cs, wwwroot/uploads/
│   ├── Dorm.Application/               ← DTOs, Services, Validators, Mapping, Abstractions
│   ├── Dorm.Domain/                    ← Entities, Enums
│   ├── Dorm.Infrastructure/            ← DbContext, Migrations, Identity, Storage, Payments, Email, Seed
│   └── tests/
│       └── Dorm.Application.Tests/
└── frontend/
    ├── .env.example
    ├── index.html
    ├── package.json
    ├── vite.config.ts
    ├── tsconfig.json
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── pages/
        ├── components/
        ├── features/                   ← auth, apartments, quiz, applications, messages, ratings, admin, payments, notifications
        ├── hooks/
        ├── services/                   ← axios client + typed api/*.ts
        ├── context/                    ← AuthContext, LanguageContext
        ├── utils/                      ← arabicNumerals, formatCurrency, dateFmt
        ├── locales/{en,ar}.json
        └── styles/index.css            ← @import "tailwindcss"; @theme { ... }
```

---

## 4. Build & run commands

> Working directory for these commands is the repo root (`marah/`) unless noted.

### Prerequisites
1. PostgreSQL 16+ running locally. Create a database named `dorm` (or update connection string).
2. Copy `backend/.env.example` → `backend/.env` and fill in `ConnectionStrings__Default`, `Jwt__Secret`, etc.
3. Copy `frontend/.env.example` → `frontend/.env` and set `VITE_API_BASE_URL=http://localhost:5080/api`.

### Backend
```powershell
# Restore + build the whole solution
dotnet restore backend/Dorm.slnx
dotnet build  backend/Dorm.slnx

# Apply EF migrations (requires `dotnet tool install --global dotnet-ef --version 10.*` once — added in Phase 1)
dotnet ef database update --project backend/Dorm.Infrastructure --startup-project backend/Dorm.API

# Run API (Swagger UI at http://localhost:5080/swagger, health at http://localhost:5080/api/health)
dotnet run --project backend/Dorm.API

# Add a new migration
dotnet ef migrations add <Name> --project backend/Dorm.Infrastructure --startup-project backend/Dorm.API

# Tests (compatibility algorithm — added in Phase 5)
dotnet test backend/Dorm.slnx

# Seed demo data — 10 owners, 20 students w/ quiz, 30 apartments, 10 tenancies,
# 8 pending applications, 4 conversations, 2 ratings. Idempotent (marker user
# guard), so re-running with seed enabled on a populated DB is a no-op.
$env:Dorm__Seed = "true"; dotnet run --project backend/Dorm.API

# Seed accounts: every seeded user logs in with one of these passwords.
#   admin@dorm.jo                / Admin123!
#   *.owner.seed@dorm.jo         / Owner123!
#   student*.seed@*.edu.jo       / Student123!
```

### Frontend
```powershell
# Install
npm install --prefix frontend

# Dev server (http://localhost:5173). /api is proxied to the .NET API on :5080.
npm run dev --prefix frontend

# Type-check (uses tsc -b; noEmit is set in tsconfig.app.json)
npm run typecheck --prefix frontend

# Production build (typecheck + vite build → frontend/dist)
npm run build --prefix frontend
```

### Git
```powershell
git status
git add <files>
git commit -m "phase N: <summary>"
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
- Payment types & amounts: **MatchCommission 15 JOD**, **FeaturedListing 10 JOD**, **VerifiedBadge 2 JOD/month**.
- README documents real CliQ integration as the next step.

### 5.6 Bilingual — Arabic default, full RTL
- `<html dir="rtl" lang="ar">` on initial load (set in `index.html` then synced by `LanguageContext`).
- All UI text via i18next from `locales/en.json` and `locales/ar.json`. **Zero hardcoded strings.**
- Dates render in **Arabic-Indic numerals** when Arabic is active (`utils/arabicNumerals.ts`).
- Prefer Tailwind logical utilities (`ps-*`, `pe-*`, `ms-*`, `me-*`, `start-*`, `end-*`) over physical (`pl/pr/ml/mr/left/right`). Mirror directional icons (chevrons, arrows) under RTL.
- Fonts: Inter (EN), Tajawal or IBM Plex Sans Arabic (AR) — Google Fonts.

### 5.7 Architecture rules
- DTOs everywhere — controllers never accept/return EF entities. AutoMapper profiles in `Dorm.Application/Mapping/`.
- Global exception middleware → consistent error envelope `{ error: { code, message, details? } }`.
- Serilog structured logs (request id, user id, route).
- File storage behind `IFileStorage` so we can swap local → Cloudinary/Azure Blob without touching controllers.

### 5.8 Quality bar
- FluentValidation on every command/request DTO (backend); Zod on every form (frontend).
- Every list page: **designed empty state** + skeleton loaders + clear error states (no "Something went wrong").
- Mobile-first responsive; semantic HTML + ARIA + alt text on all images.
- Design tokens: primary `#F97316`, generous whitespace, `rounded-2xl`, soft shadows.

### 5.9 Executing actions safely
- Initialize git locally, commit each phase. Do NOT push to a remote unless the user asks.
- No `git push --force`, no `--no-verify`, no destructive ops without explicit user approval.
- Never invent features that contradict the brief.

---

## 6. Domain quick reference

**Cities**: Amman, Irbid, Zarqa.
**Universities (NearestUniversity enum)**: JU, GJU, PSUT, YU (extend if brief seed needs more).
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

- [x] **Phase 0 — Scaffold & tooling**: `Dorm.slnx` + 4 projects + `tests/Dorm.Application.Tests`, all references wired; Dorm.API runs at `http://localhost:5080`, `/api/health` returns OK, Swagger UI at `/swagger`, Serilog console + rolling file sink active. Vite/React 19/TS frontend at `http://localhost:5173`, Tailwind v4 CSS-first config with brand orange `#F97316`, default `<html lang="ar" dir="rtl">`, folder skeleton in place, `/api` proxied to backend. `npm run build` + `dotnet build` + `dotnet test` all green.
- [x] **Phase 1 — Backend: DB, auth**: 16 entities + 16 enums (full brief schema + RefreshToken), `AppDbContext` (string-stored enums, browse indexes, restrict-on-shared-parents), startup `DatabaseBootstrap` auto-creates the `dorm` Postgres DB and runs migrations, initial EF migration applied. Auth: BCrypt hasher, JWT HS256 (1h access + 7d refresh with rotation+revocation), `DevEmailService` (logs link), `UniversityEmailDetector` (any `*.edu.jo` or named domains). 7 auth endpoints + `/api/users/me`, role policies (`Student`/`Owner`/`Admin`), `ValidationFilter` auto-runs FluentValidation, `GlobalExceptionMiddleware` produces `{error:{code,message,details?}}` envelope. Swagger `Bearer` security via `OperationFilter` (Microsoft.OpenApi 2.x compat). Smoke-tested end-to-end: register → verify-email → login → /me → refresh → all error paths.
- [x] **Phase 2 — Frontend: routing, auth, layout**: i18next w/ Arabic default + English (browser-detected, localStorage-cached, `<html lang>`/`dir` synced). Comprehensive ar/en locales (zero hardcoded UI strings). React Router v7 public + `ProtectedRoute` routes, Layout (Navbar + Outlet + Footer). Axios w/ auth-header injection + single-flight refresh-on-401 (retry-once). TanStack QueryClient w/ no-retry-on-4xx. `AuthContext` w/ token persistence, on-mount hydration, `/me` validation, register/login/logout/refresh. UI primitives: Button (variants/sizes/loading), Input/Select/FormField, Card, Spinner, Alert, LanguageToggle. Pages: Landing (hero + features), Login, Register (role/gender/university selects), Forgot/Reset password, Verify-email (token from URL, auto-call on mount + refreshes /me), Dashboard placeholder w/ verified-student badge, 404. RHF + Zod v4 forms w/ field errors + server error banner. `tsc -b` clean, prod build 26 KB CSS / 486 KB JS. Smoke-tested through Vite proxy: register → JWT issued → flow ready for browser testing.
- [x] **Phase 3 — Backend: apartments + quiz**: `IFileStorage` abstraction w/ `LocalFileStorage` (validates content-type, caps at MaxBytes, served via `UseStaticFiles` at `/uploads`). Apartments CRUD: list (filters: city/neighborhood/university/price/spots/furnished/amenities[]/maxDistance, sort: newest/price_asc/price_desc + featured-first, pagination clamped to 1–50) + detail (404 on gender mismatch, hides inactive/suspended from non-owners) + create/update/delete (owner ownership check) + photos (multipart upload, max 10 per apartment). **Gender visibility filter** at API level: male sees MaleOnly+Mixed, female sees FemaleOnly+Mixed; verified end-to-end. **Address/phone privacy**: AddressDetail + ownerPhoneNumber null in DetailDto unless caller is the owner OR has an Accepted application. Quiz: GET questions (8 keys + allowed values), POST answers (replace-all, auto-creates StudentProfile, sets QuizCompleted on full 8), GET my-answers. Fixed JWT `gender` claim remapping (read both `ClaimTypes.Gender` and `"gender"`). Photo upload smoke-tested: round-trip via `/uploads/...` static files returns identical bytes.
- [x] **Phase 4 — Frontend: browse, detail, quiz**: TS types for all backend enums + Apartment/Quiz DTOs (`utils/types.ts`); typed `apartmentsApi` + `quizApi` services. Browse page (`/browse`) w/ URL-synced filters (city/neighborhood/university/min+max price/spots/furnished/amenities[]/maxDistance), sort dropdown, list+map toggle (Leaflet + Vite icon-fix), pagination, skeleton + designed empty state. Apartment detail (`/apartments/:id`) w/ keyboard-navigable photo gallery, amenity icons (lucide), current-tenants panel (first-name + year + major, no photos), owner snippet + lock notices for hidden address/phone, neighborhood-level Leaflet map, sticky apply card (Phase 6 wires the action). Quiz page (`/quiz`, student-only) — multi-step radio-card form, progress bar + dot nav, pre-loads existing answers, submits via TanStack mutation → redirects to dashboard. Comprehensive ar/en locales (294 lines each) covering browse/apartments/quiz/match/pagination/cities/amenities/smokingRules/guestsRules. `tsc -b` clean, prod build 49 KB CSS / 700 KB JS (218 KB gzipped — Leaflet dominates). Smoke-tested through the Vite proxy: list query with `city=0&furnished=true` returned 1 of 3 apartments; quiz questions endpoint reachable.
- [x] **Phase 5 — Backend: compatibility algorithm + tests**: `CompatibilityWeights` (Smoking 25 / Cleanliness 20 / Sleep 15 / Pets 10 / Study 10 / Guests 8 / Social 7 / Cooking 5 = 100; asserted in static ctor). `CompatibilityScoring.Pairwise` uses `QuizAnswers.ByQuestion`'s **canonical ordering** (middle option at index 1) to award full / half / zero by distance 0 / 1 / 2. **Fixed QuizAnswers ordering** for SleepSchedule, Smoking, SocialStyle (the "middle" option was at index 2 — caused 5 tests to fail before the fix). `CompatibilityService.Compute` averages pairwise totals across tenants and rounds (away-from-zero); no-tenants → 100. Returns `CompatibilityBreakdownDto { Score, MatchedOn[], DifferedOn[], TenantsCount }` — matchedOn = full weight with ALL tenants; differedOn = opposite with AT LEAST one. `ApartmentService` now batch-loads student answers (1 query) + per-apartment tenant answers (1 query) and rewrites list/detail DTOs with computed scores via record `with` syntax. New endpoint `GET /api/apartments/{id}/compatibility` (student-only; 400 if quiz incomplete). Per-tenant `CompatibilityScore` injected into `CurrentTenantDto` on the detail page. **29 xUnit tests** cover weights/pairwise math/no-tenants/identical/all-opposites/adjacent half-weight/averaging/rounding/matched-differed classification/unknown-answer-safety. End-to-end smoke: student → `/compatibility` → 100 (no tenants), owner → 403.
- [x] **Phase 6 — Frontend: score display + application flow**: `CompatibilityCircle` (animated SVG donut, color-toned by score band, Arabic-Indic numerals) + `CompatibilityBreakdown` (donut + matched/differed pill lists) on apartment detail, fed by `/api/apartments/:id/compatibility` (student-only, hidden when quiz incomplete). Apartment list cards already surface `MatchBadge` (Phase 4). **Apply modal** (`features/applications/ApplyModal.tsx`): RHF + Zod (20–500 chars), live character counter, compatibility teaser inside the modal, success state with link to /applications/mine, friendly "coming next phase" message on 404 until Phase 7 backend lands. Reusable `Modal` primitive (portal, ESC/backdrop close, body-scroll lock, focus restore). `applicationsApi` typed wrapper for apply/mine/withdraw — endpoints arrive in Phase 7. `MyApplicationsPage` (`/applications/mine`, student-only route) with skeleton, status pill, withdraw button for pending, graceful 404→empty-state until Phase 7. Navbar UserMenu gains "My applications" entry for students. **Client-side highest_match sort** on browse — sorts the materialized page by `compatibilityScore desc` when the user picks that option. ar/en locales extended with `match.*` / `apply.*` / `myApps.*` / `nav.myApplications` — still zero hardcoded UI strings. `tsc -b` clean, prod build 53 KB CSS / 729 KB JS (227 KB gzipped).
- [x] **Phase 7 — Backend: applications, messaging, notifications**: `INotificationService` (CreateAsync + GetMineAsync + unread count + MarkRead + MarkAllRead). IEmailService extended with ApplicationReceived / Accepted / Rejected / NewMessage (DevEmailService logs them). `IApplicationService.ApplyAsync` validates role/quiz-completion/gender-match/active-apartment/AvailableSpots>0/no-existing-pending, snapshots compatibility score via `ICompatibilityService`, creates the `Conversation` for (student, owner, apartment), then fires notification + email to the owner. `AcceptAsync` decrements `AvailableSpots`, creates a `Tenancy` (Active, StartDate=today), updates status + RespondedAt, notifies + emails the student (privacy unlock for address+phone happens automatically via the existing `ApartmentService` rule). `RejectAsync` does the polite-decline path. `WithdrawAsync` (student-only, pending-only) flips status to Withdrawn. `IMessageService` for two-party conversations: list with other-party + last-message preview + unread count; send creates the message, bumps `Conversation.LastMessageAt`, and notifies the recipient; mark-read flips IsRead on messages NOT sent by the caller. Three new controllers — `ApplicationsController` (mixed `/api/apartments/{id}/apply` + `/api/applications/*` routes via action-level paths), `ConversationsController`, `NotificationsController` — all role-policy gated. Smoke-tested end-to-end: student apply → owner sees in `/received` → owner accepts → student sees Accepted + address+phone unlock + AvailableSpots decremented + Tenancy implicit + ApplicationAccepted notification + dev-email logged. Conversation created at apply time; student message → owner sees unread=1 → mark-read clears it; new-message notification created. Payment-creation deferred to Phase 9 (TODO marker in the Accept code path).
- [x] **Phase 8 — Frontend: dashboards + messaging UI**: `notificationsApi` / `messagesApi` typed wrappers + `applicationsApi` extended w/ received/accept/reject. `NotificationBell` in navbar w/ unread badge, dropdown, mark-read on click, mark-all-read, deep-link by type (new-message → /messages/:id, app status → /applications/mine or /owner/applications), 30s polling. `MessagesPage` two-column UI (`/messages` + `/messages/:id`): conversation list w/ unread pill + last-message preview, active conversation w/ message bubbles by sender + Check/CheckCheck read receipts, 10s message polling, 15s conversation list polling, mark-read fires on open, auto-scroll to newest, mobile collapses to one pane. `DashboardPage` now dispatches by role → `StudentDashboardPage` (quiz status card + apps/unread stat cards + big quiz CTA when incomplete + recent apps + badges + shortcuts) or `OwnerDashboardPage` (pending/accepted/listings/unread stat cards + pending apps preview + at-a-glance + shortcuts). `OwnerApplicationsPage` (`/owner/applications`, owner-only) — full applicants list w/ status filter tabs, inline accept/reject mutations w/ optimistic invalidation, student profile preview (photo + verified badge + university + year + major). Navbar gains "Messages" link for authed users + "Applications received" entry in owner UserMenu. ar/en locales extended w/ `nav.messages`/`nav.ownerApplications`/`messages.*`/`notifications.*`/`ownerApps.*`/`dashboard.cards.*`/`dashboard.quizCta.*`/`dashboard.ownerCards.*`/`dashboard.shortcuts.*`. `tsc -b` clean, prod build 762 KB JS / 233 KB gzipped.
- [x] **Phase 9 — Backend: ratings, reports, payments (mock), admin**: `IPaymentService` + `MockPaymentService` (1s simulated latency, persists Payment row Pending → Completed w/ mock txn ref). `PaymentAmounts` constants (15/10/2 JOD). `POST /api/payments/checkout` + `GET /api/payments/history`. `IRatingService.SubmitAsync` (only between ex-tenant ↔ owner of the same apartment w/ an Ended tenancy; unique-per-triple via DB index; notifies recipient). `GET /api/users/{id}/ratings` public. `PUT /api/tenancies/{id}/end` (either party — flips status, sets EndDate, frees a spot, notifies both to rate). `IReportService.SubmitAsync` w/ **3-strike auto-suspend** (counts Pending reports for the listing; flips `IsSuspended=true` + notifies owner at threshold). Owners can't report their own listing. `IAdminService` covering: GET dashboard (users/listings/tenancies-this-month/active/pending-reports/revenue-month/revenue-all-time/revenueByType groupings), GET users (search+role filter), PUT users/{id}/ban+unban, GET listings (search+suspended filter w/ pendingReportsCount per row), PUT listings/{id}/suspend+activate, GET reports queue (pendingOnly), PUT reports/{id}/resolve (Dismiss option lifts the auto-suspend when no Pending reports remain). `[Authorize(Policy=Admin)]` on the whole AdminController. `AdminSeeder` runs after migrations and creates `admin@dorm.jo` / `Admin123!` if missing. Smoke-tested live: admin login → dashboard returns 9 users / 4 active listings / 1 active tenancy. Omar's MatchCommission checkout returned 15 JOD Completed with a mock txn ref. 3 reports against an apartment auto-suspended it (verified via /admin/listings); 3 admin Dismiss actions lifted the suspension. Pre-tenancy-end rating attempt returned 403.
- [x] **Phase 10 — Frontend: admin, payments, ratings**: New types + API services for `admin` / `payments` / `ratings` / `reports`. `PaymentHistoryPage` with type icons, status pills, total-paid summary. `PayFeeButton` on accepted applications (mock 15 JOD checkout, 1s latency, success state persists via cache invalidation). `AdminLayout` w/ tab sub-nav (Dashboard / Users / Listings / Reports) + Outlet, gated to Admin role via `ProtectedRoute`. `AdminDashboardPage` — 8 stat cards (totalUsers / totalStudents / totalOwners / activeListings / suspendedListings / activeTenancies / pendingReports / revenueThisMonth) + custom SVG `RevenueChart` horizontal-bar by payment type, 60s refetch. `AdminUsersPage` — search + role filter + ban/unban w/ optimistic invalidation. `AdminListingsPage` — search + status filter + suspend/activate + pendingReportsCount badge + link to detail. `AdminReportsPage` — pendingOnly toggle + dismiss (lifts auto-suspend when last) / resolve actions. `ReportListingModal` — 5-reason select + optional description, wired on the public listing detail Report button. `RatingModal` — 1–5 star picker + optional comment, wired against the public ratings API. Dashboard dispatcher updated so Admin role → `Navigate to=/admin`. Navbar UserMenu gains "Payments" entry for everyone + "Admin panel" entry for Admin role. Full `admin.*` / `payments.*` / `report.*` / `rating.*` locale trees in both en.json + ar.json (zero hardcoded UI strings). `tsc -b` clean, prod build 835 KB JS / 250 KB gzipped.
- [x] **Phase 11 — Bilingual polish + RTL audit**: four-agent parallel audit pass: hardcoded-strings, physical-utilities, date/numeral formatting, directional icons. Physical-utilities (183 logical-utility usages, zero physical) + date/numeral helpers (`formatDate` + `maybeArabicDigits` wired everywhere) came back clean. Fixed: hardcoded English `Admin` role label in `AdminUsersPage` (now `t('roles.admin')` w/ new `roles.admin` + `common.previous` keys added to en/ar locales); `PhotoGallery` chevrons gained `rtl:rotate-180` + `aria-label="previous|next"` → `t('common.previous|next')`; `StudentDashboardPage`'s `ArrowFwd = isRtl ? ArrowRight : ArrowRight` logic bug now correctly swaps to `ArrowLeft` under RTL; `MessagesPage` Send button gained `rtl:-scale-x-100` so the paper-plane points in the natural reading direction.
- [x] **Phase 12 — Seed + final polish**: seed already shipped end of Phase 9 / 12-partial (`DataSeeder` w/ 10 owners + 20 students + 30 apartments + 10 tenancies + 8 applications + 4 conversations + 2 ratings, idempotent marker-user guard). README.md replaced (was a corrupt 2-byte stub) — full setup guide w/ prerequisites, env-file copy, first-run db bootstrap, optional `Dorm__Seed=true`, seeded-account table, run commands, structure overview, mocked-services table (`MockPaymentService` / `DevEmailService` / `LocalFileStorage`), non-negotiable rules summary. `backend/.env.example` extended w/ `Dorm__Seed=false` line + comment. Final gauntlet: `npm run typecheck` clean, `npm run build` 836 KB JS / 250 KB gzipped, `dotnet build` 0 warnings / 0 errors, `dotnet test` 29/29 pass.

---

## 8. Working agreements

- After each phase: run backend, run frontend, smoke-test the new slice, then commit (`phase N: <summary>`). Do not move on until the slice runs.
- When stuck on a peripheral feature, **prioritize the core flow** (signup → quiz → browse → score → apply → accepted) over admin/ratings completeness.
- Keep this file updated — tick checklist items, adjust versions as pinned, append decisions that affect future phases.
- Stop and confirm with the user before any irreversible action beyond local file edits and local commits.
