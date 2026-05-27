# Dorm — Build Brief

> Save this file in the repo at `docs/BUILD_BRIEF.md`. It is the authoritative source of truth for the Dorm build. Claude Code is instructed to read it before writing any code.

## Project Overview

A full-stack web application called **Dorm** — a bilingual (Arabic/English, full RTL support) platform that helps Jordanian university students find apartments near their campus and get matched with compatible roommates.

The app is two-sided:

- **Students** — sign up, take a lifestyle compatibility quiz, browse apartments, see a compatibility match score with current tenants, apply to join an apartment, message owners, rate experiences.
- **Apartment Owners** — list their apartments, set rent and number of spots, review student applications, see each applicant's compatibility score with existing tenants, accept or reject.

The standout feature is the **Roommate Compatibility Score** — a weighted matching algorithm that shows a percentage compatibility between a student and the current tenants of any apartment based on lifestyle quiz answers.

## Tech Stack (Required)

- **Frontend:** React 19 + Vite + TypeScript + Tailwind CSS v4 + React Router + TanStack Query + Axios + Leaflet (maps) + i18next (Arabic/English) + React Hook Form + Zod + lucide-react (icons)
- **Backend:** ASP.NET Core Web API on **.NET 10 (current LTS)** + Entity Framework Core + JWT authentication + FluentValidation + AutoMapper + Serilog + Swashbuckle (Swagger)
- **Database:** PostgreSQL (preferred) or SQL Server
- **File storage:** Local `/wwwroot/uploads/` folder for development (with notes for switching to Cloudinary/Azure Blob in production)

> **.NET version note:** This brief targets **.NET 10** (LTS, supported to Nov 2028, Microsoft's recommended production version). The original draft said .NET 8, but .NET 8 reaches end of support on **Nov 10, 2026**. If your university/examiners explicitly require .NET 8, change `net10.0` → `net8.0` everywhere; nothing else in the stack changes.

## Project Structure

```
dorm/
├── backend/
│   ├── Dorm.API/              # Controllers, middleware, Program.cs
│   ├── Dorm.Application/      # Services, DTOs, validators, business logic
│   ├── Dorm.Domain/           # Entities, enums, domain logic
│   ├── Dorm.Infrastructure/   # DbContext, EF migrations, external services
│   └── Dorm.sln
└── frontend/
    └── src/
        ├── pages/
        ├── components/
        ├── features/
        ├── hooks/
        ├── services/
        ├── context/
        ├── utils/
        ├── locales/
        │   ├── en.json
        │   └── ar.json
        └── styles/
```

## User Roles

- **Student** — browses, applies, messages, rates
- **Owner** — lists apartments, reviews applications
- **Admin** — moderates listings, reviews reports, sees revenue dashboard

A user has exactly one role chosen at signup. Admins are seeded manually.

## Core Features (Build All of These)

### 1. Authentication

- Email + password signup with role selection (Student or Owner)
- JWT access tokens (1 hour) + refresh tokens (7 days)
- Email verification via emailed link
- **University email verification** (separate from email verification) — when a student signs up with an email ending in `@ju.edu.jo`, `@gju.edu.jo`, `@psut.edu.jo`, `@yu.edu.jo`, or similar, after they click the verification link they get a **"Verified Student"** badge
- Forgot password / reset password flow
- Protected routes by role on both frontend and backend

### 2. Student Onboarding & Lifestyle Quiz

After signup, students must complete a one-time quiz before they can apply to apartments. The quiz has **8 questions** (gender preference and religion observance are **NOT** in the quiz — see "Important Rules"):

1. **Sleep schedule** — Early bird / Night owl / Flexible
2. **Cleanliness level** — Very tidy / Average / Relaxed
3. **Smoking** — Yes / No / Outside only
4. **Study habits** — Quiet study at home / Library person / Group study at home
5. **Social style** — Introvert / Extrovert / Balanced
6. **Guests frequency** — Often / Sometimes / Rarely
7. **Cooking habits** — Cook a lot / Cook sometimes / Mostly eat out
8. **Pet tolerance** — Love pets / Tolerate them / Prefer no pets

Students can update their quiz answers anytime from their profile.

### 3. Apartment Listing (Owner Side)

Multi-step form for owners to create a listing:

- **Step 1 — Basic info:** Title, description, city (Amman / Irbid / Zarqa), neighborhood
- **Step 2 — Location:** Pin location on a Leaflet map, select nearest university from a dropdown, enter walking distance in minutes
- **Step 3 — Photos:** Upload up to 10 photos (drag and drop)
- **Step 4 — Pricing & spots:** Full monthly rent in JOD, total spots in the apartment, currently available spots
- **Step 5 — Amenities:** Multi-select checkboxes (Wi-Fi, AC, Heating, Washing machine, Parking, Furnished, Elevator, Balcony, Kitchen, Private bathroom)
- **Step 6 — House rules:** Smoking allowed (yes/no/outside), Guests allowed (yes/no/limited), Apartment gender type (auto-set, see rules below)
- **Step 7 — Review & publish**

### 4. Apartment Browse Page

- List view and Map view toggle (default: list)
- **Filters:** University (dropdown); City and neighborhood; Price range (slider in JOD); Available spots (1, 2, 3, 4+); Furnished (yes/no/any); Amenities (multi-select); Maximum walking distance (slider in minutes)
- **Sort:** Newest, Price ascending, Price descending, Highest match (only when student is logged in and quiz is complete)
- Each card shows: main photo, title, neighborhood, price per person, total spots vs available, owner rating, "X% match" badge if student is logged in

### 5. Apartment Detail Page

Shows:

- Photo gallery (carousel)
- Title, description, full address (street-level hidden until application is accepted — show neighborhood only)
- Price per person, total rent, available spots
- Amenities list with icons
- House rules
- **Current tenants section** — small cards showing first name + year + major + "X% match with you" if logged in (do **NOT** show profile photos here for privacy — only on accepted applications)
- **Compatibility score breakdown** — big circular percentage + a list of "You match on: sleep schedule, cleanliness ✓" and "You differ on: social style ✗"
- Owner profile snippet (name, rating, member since)
- "Apply for this spot" button — opens a modal where the student writes a short message
- Map showing approximate location (neighborhood-level pin, not exact)
- Save/favorite button (heart icon)
- Report listing button

### 6. The Compatibility Score Algorithm (Critical Feature)

Implement in the backend as a service method `CompatibilityService.CalculateScore(studentQuizAnswers, tenantsQuizAnswers)`.

**Algorithm:**

- For each tenant in the apartment, compute a pairwise score between the student and that tenant.
- The apartment's compatibility score = the **average** of all pairwise scores.
- If the apartment has **no current tenants, return 100%** (no roommates to clash with).

**Pairwise scoring:** Each of the 8 questions has a weight. Total weights = 100.

| Question          | Weight |
| ----------------- | ------ |
| Smoking           | 25     |
| Cleanliness level | 20     |
| Sleep schedule    | 15     |
| Pet tolerance     | 10     |
| Study habits      | 10     |
| Guests frequency  | 8      |
| Social style      | 7      |
| Cooking habits    | 5      |
| **Total**         | **100**|

For each question, compare the student's answer with the tenant's answer:

- **Same answer** → award full weight
- **Adjacent/compatible answers** → award half weight (e.g., "Flexible" is compatible with both "Early bird" and "Night owl"; "Sometimes" is compatible with both "Often" and "Rarely")
- **Opposite answers** → award 0

Sum the awarded weights → that's the pairwise score out of 100. Return the final percentage **rounded to the nearest integer**. Also return the **per-question breakdown** so the frontend can show "You match on X, Y, Z" / "You differ on A, B".

### 7. Application Flow

- Student clicks "Apply" → writes a short message (max 500 chars) → submits
- Owner gets a notification (in-app + email)
- Owner's "Applications received" page shows each applicant with: Name, profile photo, university, year, major; Verified student badge (if applicable); Compatibility score with current tenants; the student's message; Accept / Reject / Message buttons
- **On Accept:** Application status → Accepted; Available spots decreases by 1; a **Tenancy** record is created (student → apartment, start date = today, end date = null); student gets notified, gets the owner's phone number unlocked, and is prompted to pay the **15 JOD** platform fee; other pending applications for that same spot remain pending (owner can reject them or hold)
- **On Reject:** student gets a polite notification

### 8. In-App Messaging

- Once an application is submitted (not waiting for acceptance), student and owner can message each other
- Simple two-column UI: conversations list on the left, messages on the right
- Polling every 10 seconds to check for new messages (no SignalR/WebSockets — keep build simple)
- Read receipts (read/unread)
- File attachments are out of scope for v1 — text only

### 9. Saved Listings

- Students can heart/save any listing
- "My saved" page shows all saved listings
- Optional weekly email digest of new listings matching their saved search filters

### 10. Ratings & Reviews

- When a tenancy ends (owner marks it ended, or student clicks "I moved out"), both parties can rate each other 1–5 stars + leave a short comment
- Ratings are public on profiles
- Owners get an aggregate rating shown on their listings; students get a rating shown on their applications

### 11. Reports & Moderation

- Any user can report a listing with a reason (Fake listing / Misleading photos / Scam / Inappropriate / Other)
- 3 valid reports auto-suspend the listing pending admin review
- Admin panel shows queue of reports

### 12. Notifications

- In-app notification bell with dropdown (top-right of navbar)
- Types: new application received, application accepted, application rejected, new message, new rating, listing suspended
- Email notifications for critical events (application accepted/rejected, new message when user offline > 1 hour)

### 13. Admin Panel (`/admin`)

- Dashboard: total users, total active listings, total tenancies this month, revenue this month (chart)
- Users table: search, filter by role, ban/unban
- Listings table: search, filter by status, suspend/reactivate
- Reports queue: review and resolve
- Revenue log: every payment with type and amount

### 14. Payments

- Use a **mocked** payment service: an interface `IPaymentService` with a `MockPaymentService` implementation that always returns success after a 1-second delay
- Real CliQ integration documented as "next step" in the README
- Payment types: **MatchCommission (15 JOD)**, **FeaturedListing (10 JOD)**, **VerifiedBadge (2 JOD/month subscription)**
- Payment history page for both students and owners

### 15. Bilingual Support (Arabic/English)

- Toggle in the navbar (globe icon)
- **Default language: Arabic** (target market is Jordan)
- When Arabic is active: `<html dir="rtl" lang="ar">` and Tailwind RTL utilities apply
- Use i18next with translation JSON files in `locales/en.json` and `locales/ar.json`
- **ALL UI text must be translated — no hardcoded strings**
- Dates display in Arabic-Indic numerals when Arabic is active

## Important Rules — Read Carefully

### Gender handling (NOT a quiz question, NOT a filter)

Gender preference must **NOT** be a question in the quiz or a filter on the browse page. Instead, the system handles gender matching automatically based on the apartment owner's setup:

- When an owner creates an apartment, they must select the apartment's gender type: **Male only**, **Female only**, or **Mixed**
- A student's gender is collected at signup (Male / Female)
- The browse page automatically hides apartments that don't match the student's gender:
  - A male student only sees **Male-only** and **Mixed** apartments
  - A female student only sees **Female-only** and **Mixed** apartments
- The default and most common selection should be **single-gender** (Male only / Female only), reflecting cultural norms in Jordan where mixed-gender shared housing is uncommon
- This filtering happens at the **API level** — the backend never returns apartments that don't match the requesting student's gender

### Religion observance (REMOVED)

Do **NOT** include religion or religion observance anywhere — not in the quiz, not in the filters, not in the profile, not in apartment listings. Skip this topic entirely.

### Privacy

- Exact street addresses are hidden until an application is accepted — only show neighborhood
- Phone numbers are hidden until an application is accepted
- Student profile photos in "current tenants" section on apartment pages are hidden — only first name + year + major

## Database Schema (Entity Framework Core Entities)

Use PostgreSQL. Generate EF Core migrations.

**User** — Id (Guid, PK), FullName, Email (unique), PasswordHash, PhoneNumber, Role (enum: Student, Owner, Admin), Gender (enum: Male, Female), IsEmailVerified (bool), IsUniversityVerified (bool), ProfilePhotoUrl (nullable), University (nullable), CreatedAt, IsBanned (bool)

**StudentProfile** — Id, UserId (FK, 1-1), Bio (nullable), Year (1-5), Major, QuizCompleted (bool)

**QuizAnswer** — Id, StudentProfileId (FK), QuestionKey (enum: SleepSchedule, Cleanliness, Smoking, StudyHabits, SocialStyle, Guests, Cooking, PetTolerance), AnswerValue (string)

**Apartment** — Id, OwnerId (FK), Title, Description, City, Neighborhood, AddressDetail (hidden until accepted), Latitude, Longitude, FullRent (decimal), TotalSpots (int), AvailableSpots (int), GenderType (enum: MaleOnly, FemaleOnly, Mixed), IsFurnished, NearestUniversity (enum), DistanceMinutes, SmokingRule (enum), GuestsRule (enum), IsFeatured, FeaturedUntil (nullable date), IsActive, IsSuspended, CreatedAt

**ApartmentAmenity** — Id, ApartmentId (FK), AmenityType (enum) — many-to-many

**ApartmentPhoto** — Id, ApartmentId (FK), PhotoUrl, DisplayOrder

**Tenancy** — Id, ApartmentId (FK), StudentId (FK), StartDate, EndDate (nullable), Status (enum: Active, Ended)

**Application** — Id, ApartmentId (FK), StudentId (FK), Message, CompatibilityScore (int), Status (enum: Pending, Accepted, Rejected, Withdrawn), CreatedAt, RespondedAt (nullable)

**Conversation** — Id, Participant1Id (FK), Participant2Id (FK), ApartmentId (FK), LastMessageAt

**Message** — Id, ConversationId (FK), SenderId (FK), Content, IsRead, SentAt

**Rating** — Id, RaterId (FK), RatedUserId (FK), ApartmentId (FK), Stars (1-5), Comment, CreatedAt

**SavedListing** — Id, StudentId (FK), ApartmentId (FK), CreatedAt

**Report** — Id, ReporterId (FK), ReportedApartmentId (FK), Reason (enum), Description, Status (enum: Pending, Resolved, Dismissed), CreatedAt, ResolvedAt (nullable), ResolvedByAdminId (FK, nullable)

**Payment** — Id, UserId (FK), Type (enum: MatchCommission, FeaturedListing, VerifiedBadge), Amount, Status (enum: Pending, Completed, Failed), TransactionRef, CreatedAt

**Notification** — Id, UserId (FK), Type (enum), Title, Content, IsRead, RelatedEntityId (nullable Guid), CreatedAt

## API Endpoints (Reference)

**Auth**
- `POST /api/auth/register` — body: `{ fullName, email, password, role, gender, phoneNumber, university? }`
- `POST /api/auth/login` — body: `{ email, password }` → returns `{ accessToken, refreshToken, user }`
- `POST /api/auth/refresh` — body: `{ refreshToken }`
- `POST /api/auth/verify-email?token=...`
- `POST /api/auth/verify-university` — sends email to user's university email
- `POST /api/auth/forgot-password` — body: `{ email }`
- `POST /api/auth/reset-password` — body: `{ token, newPassword }`

**Profile**
- `GET /api/users/me` — current user profile
- `PUT /api/users/me` — update profile
- `POST /api/users/me/photo` — upload profile photo
- `GET /api/users/{id}/public` — public profile (no email, no phone)
- `GET /api/users/{id}/ratings`

**Quiz**
- `GET /api/quiz/questions` — returns the 8 questions and their options
- `POST /api/quiz/answers` — body: `{ answers: [{ questionKey, answerValue }, ...] }`
- `GET /api/quiz/my-answers`

**Apartments**
- `GET /api/apartments` — query: city, neighborhood, university, minPrice, maxPrice, spotsAvailable, furnished, amenities[], maxDistance, sort, page, pageSize. Backend auto-filters by requesting student's gender.
- `GET /api/apartments/{id}`
- `POST /api/apartments` — owner only
- `PUT /api/apartments/{id}` — owner only
- `DELETE /api/apartments/{id}` — owner only
- `POST /api/apartments/{id}/photos` — multipart upload
- `DELETE /api/apartments/{id}/photos/{photoId}`
- `GET /api/apartments/{id}/compatibility` — student only, returns score + breakdown

**Applications**
- `POST /api/apartments/{id}/apply` — body: `{ message }`
- `GET /api/applications/mine` — student
- `GET /api/applications/received` — owner
- `PUT /api/applications/{id}/accept` — owner
- `PUT /api/applications/{id}/reject` — owner
- `DELETE /api/applications/{id}` — student withdraws

**Messages**
- `GET /api/conversations` — current user's conversations
- `GET /api/conversations/{id}/messages?before=...`
- `POST /api/conversations/{id}/messages` — body: `{ content }`
- `PUT /api/conversations/{id}/read`

**Ratings**
- `POST /api/ratings` — body: `{ ratedUserId, apartmentId, stars, comment }`
- `GET /api/users/{id}/ratings`

**Saved**
- `POST /api/saved/{apartmentId}`
- `DELETE /api/saved/{apartmentId}`
- `GET /api/saved`

**Reports**
- `POST /api/reports` — body: `{ apartmentId, reason, description }`
- `GET /api/admin/reports` — admin only
- `PUT /api/admin/reports/{id}/resolve` — admin only

**Payments**
- `POST /api/payments/checkout` — body: `{ type, relatedEntityId? }` → uses mock service
- `GET /api/payments/history`

**Notifications**
- `GET /api/notifications`
- `PUT /api/notifications/{id}/read`
- `PUT /api/notifications/read-all`

**Admin**
- `GET /api/admin/dashboard` — stats and revenue
- `GET /api/admin/users` — paginated
- `PUT /api/admin/users/{id}/ban`
- `PUT /api/admin/users/{id}/unban`
- `GET /api/admin/listings`
- `PUT /api/admin/listings/{id}/suspend`
- `PUT /api/admin/listings/{id}/activate`

## Frontend Pages (Routes)

**Public:** `/` (Landing), `/browse`, `/apartments/:id`, `/universities/:slug` (Filtered browse), `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email`

**Student:** `/dashboard`, `/quiz`, `/profile`, `/saved`, `/messages`, `/messages/:conversationId`, `/payments`

**Owner:** `/owner/dashboard`, `/owner/listings/new`, `/owner/listings/:id/edit`, `/owner/applications`, `/owner/messages`, `/owner/payments`

**Admin:** `/admin`, `/admin/users`, `/admin/listings`, `/admin/reports`

## Design Guidelines

- **Color palette:** Primary orange `#F97316`, neutral grays, white background; dark mode optional but nice to have
- **Typography:** Inter for English, Tajawal or IBM Plex Sans Arabic for Arabic — both on Google Fonts
- **Style:** Clean, modern, lots of whitespace, rounded corners (`rounded-2xl`), soft shadows
- **Mobile-first responsive** — must look great on phones (most Jordanian students browse on mobile)
- **Accessibility:** semantic HTML, ARIA labels, keyboard navigation, alt text on all images
- **Empty states:** every list page gets a designed empty state (illustration + message + CTA)
- **Loading states:** skeleton loaders for content, spinners for actions
- **Error states:** clear error messages, never just "Something went wrong"

## Seed Data

Create a seed script that populates the database with:

- 1 admin user (email: `admin@dorm.jo`, password: `Admin123!`)
- 20 student users with completed quizzes (mix of genders, mix of universities)
- 10 owner users
- 30 apartments across Amman, Irbid, and Zarqa (mix of genders, prices 80–250 JOD per spot, various amenities)
- Several active tenancies so apartments have current tenants
- A handful of pending applications
- Sample ratings and messages

## Deliverables

- Working backend API with Swagger documentation at `/swagger`
- Working frontend with all routes
- Database migrations and seed script
- **README** in the root with: project description; tech stack; setup instructions (backend, frontend, database); how to run seed data; default credentials for admin / sample student / sample owner; notes on switching from mock payments to real CliQ; notes on switching from local file storage to cloud storage
- `.env.example` files for both frontend and backend
- Both Arabic and English working end-to-end

## Build Order Recommendation

1. Backend: project setup, database, migrations, auth endpoints
2. Frontend: project setup, routing, auth pages, layout (navbar, footer)
3. Backend: apartment CRUD, photo upload, quiz endpoints
4. Frontend: browse page, apartment detail, quiz page
5. Backend: compatibility algorithm + endpoint
6. Frontend: compatibility score display, application flow
7. Backend: applications, messaging, notifications
8. Frontend: dashboards (student and owner), messaging UI
9. Backend: ratings, reports, payments (mock), admin
10. Frontend: admin panel, payment history, ratings
11. Bilingual (Arabic) + RTL polish
12. Seed data + final polish + responsive review

## Final Notes

- Write clean, idiomatic, well-commented code
- Use DTOs everywhere — never expose EF entities directly
- Validate all inputs with FluentValidation (backend) and Zod (frontend)
- Handle errors gracefully — global error middleware (backend), error boundaries (frontend)
- Log everything important with Serilog
- Write a few unit tests for the compatibility algorithm — it's the heart of the app

Build this as a real, production-quality graduation project. **Quality matters more than feature count** — if anything runs into trouble, prioritize getting the core flow (signup → quiz → browse → see match score → apply → get accepted) working flawlessly over fully-built admin or ratings features.
