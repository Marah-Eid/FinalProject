# Dorm — Project Report

---

## 1. Project Overview

### 1.1 Project Idea

**Dorm** is a bilingual (Arabic/English) web application that helps Jordanian university students find apartments near campus and get matched with compatible roommates through a weighted lifestyle quiz. Three roles use the platform: Students browse and apply, Owners list apartments and review applicants, and Admins moderate the platform.

### 1.2 Purpose

| Problem | How Dorm Solves It |
|---------|-------------------|
| Hard to find housing near universities | Filterable apartment search with map view, city/university/price/amenity filters |
| Risk of incompatible roommates | 8-question lifestyle quiz produces a compatibility percentage with current tenants |
| Scattered communication | In-app messaging, application tracking, and notifications in one place |

### 1.3 Main Features

1. **Authentication** — Register (Student/Owner), JWT tokens, email verification, university-verified badge, forgot/reset password, role-based access.
2. **Lifestyle Quiz** — 8 questions (Sleep, Cleanliness, Smoking, Study, Social, Guests, Cooking, Pets). Required before applying.
3. **Compatibility Algorithm** — Weighted scoring (total = 100). Same answer = full weight, adjacent = half, opposite = 0. Averaged across tenants. No tenants = 100%.
4. **Apartment Listings** — Owners create listings with photos (up to 10), rent, spots, amenities, house rules, gender policy, and map location.
5. **Browse & Search** — Filters, sorting, list/map toggle, pagination. Gender-filtered at API level.
6. **Privacy Controls** — Address and phone hidden until application is accepted. Tenant info shows first name + year + major only.
7. **Application Flow** — Students apply with a message. Owners accept (creates tenancy, unlocks info) or reject. Students can withdraw.
8. **Messaging** — Two-party conversations per apartment. Read receipts. Polling-based updates.
9. **Notifications** — In-app bell with unread count. Covers applications, messages, ratings, suspensions.
10. **Ratings** — 1–5 stars + optional comment after tenancy ends. One per (rater, rated, apartment).
11. **Reports & Moderation** — Users report listings. 3 pending reports auto-suspend. Admin can dismiss or resolve.
12. **Payments (Mocked)** — Match Commission 15 JOD, Featured Listing 10 JOD, Verified Badge 2 JOD/month.
13. **Admin Panel** — Dashboard stats, user management (ban/unban), listing management (suspend/activate), reports queue.
14. **Bilingual RTL** — Arabic default, full RTL layout, zero hardcoded strings, Arabic-Indic numerals.

### 1.4 Target Users

| Role | Description |
|------|-------------|
| **Student** | University students who complete the quiz, browse apartments, view compatibility scores, apply, and message owners. |
| **Owner** | Property owners who list apartments, review applications with scores, accept/reject, and communicate with students. |
| **Admin** | Platform administrators who moderate listings, manage users, review reports, and monitor revenue. |

---

## 2. Functional Requirements

### 2.1 Authentication & Authorization

| ID | Requirement |
|----|-------------|
| FR-AUTH-01 | Users register with name, email, password, role (Student/Owner), gender, phone, and optional university. |
| FR-AUTH-02 | Admin accounts are created only through database seeding, not the public API. |
| FR-AUTH-03 | Login issues JWT access tokens (1h) and refresh tokens (7d). |
| FR-AUTH-04 | Refresh tokens rotate on use — old token is revoked, new one issued. |
| FR-AUTH-05 | Email verification link sent on registration. |
| FR-AUTH-06 | University emails (*.edu.jo) auto-grant "Verified Student" badge when verified. |
| FR-AUTH-07 | Students with non-university emails can separately verify a university email for the badge. |
| FR-AUTH-08 | Forgot/reset password via emailed token (1h expiry). Reset revokes all refresh tokens. |
| FR-AUTH-09 | Role-based route protection: Student-only, Owner-only, Admin-only on backend and frontend. |
| FR-AUTH-10 | Banned users cannot log in. |

### 2.2 Student Features

| ID | Requirement |
|----|-------------|
| FR-STU-01 | Students must complete the 8-question lifestyle quiz before applying. |
| FR-STU-02 | Quiz answers can be updated anytime. |
| FR-STU-03 | Browse apartments with filters (city, university, price, spots, furnished, amenities, distance) and sort options. |
| FR-STU-04 | Toggle between list view and map view. |
| FR-STU-05 | See compatibility score (%) on each apartment card and detail page. |
| FR-STU-06 | See per-question compatibility breakdown (matched/differed lists) on detail page. |
| FR-STU-07 | Apply with a message (20–500 chars). Score snapshotted at submission. |
| FR-STU-08 | Only see gender-matching apartments (Male → Male Only + Mixed; Female → Female Only + Mixed). |
| FR-STU-09 | Address and phone hidden until application is accepted. |
| FR-STU-10 | Can withdraw pending applications. |
| FR-STU-11 | View application history with status (Pending/Accepted/Rejected/Withdrawn). |
| FR-STU-12 | Message owners through in-app messaging after applying. |
| FR-STU-13 | Receive notifications for application status changes, messages, and ratings. |
| FR-STU-14 | Save/favorite apartment listings. |
| FR-STU-15 | Rate owners (1–5 stars) after tenancy ends. |
| FR-STU-16 | Report listings with a reason. |
| FR-STU-17 | Pay Match Commission (15 JOD) after acceptance. |

### 2.3 Owner Features

| ID | Requirement |
|----|-------------|
| FR-OWN-01 | Create listings with full details (title, description, location, rent, spots, gender type, amenities, rules). |
| FR-OWN-02 | Upload up to 10 photos per listing. |
| FR-OWN-03 | Update and delete own listings. |
| FR-OWN-04 | View received applications with student info and compatibility scores. |
| FR-OWN-05 | Accept applications — decrements spots, creates tenancy, unlocks private info, notifies student. |
| FR-OWN-06 | Reject applications — notifies student. |
| FR-OWN-07 | Message applicant students. |
| FR-OWN-08 | End tenancies — frees a spot, prompts both parties to rate. |
| FR-OWN-09 | Pay for Featured Listing (10 JOD). |
| FR-OWN-10 | Receive notifications for new applications and messages. |

### 2.4 Admin Features

| ID | Requirement |
|----|-------------|
| FR-ADM-01 | Dashboard with stats: users, listings, tenancies, reports, revenue breakdown. |
| FR-ADM-02 | Search/filter users by role, ban/unban accounts. |
| FR-ADM-03 | Search/filter listings by status, suspend/activate. |
| FR-ADM-04 | Review reports queue, dismiss or resolve. Dismissing last pending report lifts suspension. |
| FR-ADM-05 | 3 pending reports auto-suspend a listing. |

### 2.5 CRUD Summary

| Entity | Create | Read | Update | Delete |
|--------|--------|------|--------|--------|
| User | Register | GET /me | Profile update | Ban (soft) |
| Apartment | POST | GET list + detail | PUT | DELETE |
| Application | POST apply | GET mine/received | Accept/Reject/Withdraw | — |
| Conversation | Auto on apply | GET list | — | — |
| Message | POST send | GET by conversation | Mark read | — |
| Rating | POST | GET by user | — | — |
| Report | POST | GET (admin) | Resolve/Dismiss | — |
| Payment | POST checkout | GET history | — | — |
| Notification | Auto by system | GET mine | Mark read | — |

---

## 3. Non-Functional Requirements

### 3.1 Performance

| ID | Requirement |
|----|-------------|
| NFR-PERF-01 | Pagination clamped to 1–50 items per page. |
| NFR-PERF-02 | Database indexes on frequently filtered columns (city, university, gender, price, spots, status). |
| NFR-PERF-03 | Compatibility scores computed via batch queries to minimize round-trips. |
| NFR-PERF-04 | TanStack React Query for client-side caching and background re-fetching. |
| NFR-PERF-05 | Message polling at 10s intervals, conversation list at 15s. |

### 3.2 Security

| ID | Requirement |
|----|-------------|
| NFR-SEC-01 | Passwords hashed with BCrypt. |
| NFR-SEC-02 | JWT signed with HMAC-SHA256 (32+ byte key). |
| NFR-SEC-03 | Refresh tokens stored as SHA-256 hashes (not raw). |
| NFR-SEC-04 | All verification/reset tokens stored as SHA-256 hashes with expiry. |
| NFR-SEC-05 | Refresh token rotation enforced. Password reset revokes all tokens. |
| NFR-SEC-06 | All inputs validated: FluentValidation (backend), Zod v4 (frontend). |
| NFR-SEC-07 | File uploads: jpg/png/webp only, max 5 MB. |
| NFR-SEC-08 | CORS restricted to frontend origin. |
| NFR-SEC-09 | Ownership checks on all owner operations. |
| NFR-SEC-10 | Forgot-password returns same response regardless of email existence. |

### 3.3 Usability

| ID | Requirement |
|----|-------------|
| NFR-USE-01 | Fully bilingual (Arabic default, English) with RTL support. |
| NFR-USE-02 | All UI text in translation files — zero hardcoded strings. |
| NFR-USE-03 | Arabic-Indic numerals when Arabic is active. |
| NFR-USE-04 | Designed empty states with icons and call-to-action on every list page. |
| NFR-USE-05 | Skeleton loaders for content, spinners for actions. |
| NFR-USE-06 | Clear, specific error messages — no generic "Something went wrong." |
| NFR-USE-07 | Brand color #F97316 (orange), rounded corners, soft shadows. |

### 3.4 Scalability & Architecture

| ID | Requirement |
|----|-------------|
| NFR-SCA-01 | Clean Architecture: API, Application, Domain, Infrastructure layers. |
| NFR-SCA-02 | File storage behind `IFileStorage` abstraction (swappable to cloud). |
| NFR-SCA-03 | Payments behind `IPaymentService` abstraction (swappable to real provider). |
| NFR-SCA-04 | Email behind `IEmailService` abstraction (swappable to SMTP/SendGrid). |
| NFR-SCA-05 | DTOs everywhere — entities never exposed through controllers. |

### 3.5 Responsiveness

| ID | Requirement |
|----|-------------|
| NFR-RES-01 | Mobile-first responsive design. |
| NFR-RES-02 | Tailwind logical utilities (ps-*, pe-*, ms-*, me-*) for RTL support. |
| NFR-RES-03 | Directional icons mirror under RTL. |

### 3.6 Reliability

| ID | Requirement |
|----|-------------|
| NFR-REL-01 | Global exception middleware returns structured JSON errors (no raw stack traces). |
| NFR-REL-02 | Serilog structured logging with request IDs, user IDs, and routes. |
| NFR-REL-03 | Database bootstrap is idempotent (safe to re-run). |
| NFR-REL-04 | Demo seeder is idempotent (marker-user guard). |

---

## 4. Database Design & Connection

### 4.1 Technology

| Item | Value |
|------|-------|
| Database Engine | SQL Server (LocalDB) |
| ORM | Entity Framework Core 9 (Code-First) |
| Connection String | `Server=(localdb)\MSSQLLocalDB;Database=dorm;Trusted_Connection=True` |
| Migrations | Auto-applied on startup via `DatabaseBootstrap` |

### 4.2 Database Schema

#### Users
| Column | Type | Constraints |
|--------|------|-------------|
| Id | uniqueidentifier | PK |
| FullName | nvarchar(120) | NOT NULL |
| Email | nvarchar(254) | NOT NULL, UNIQUE |
| PasswordHash | nvarchar(255) | NOT NULL |
| PhoneNumber | nvarchar(40) | NOT NULL |
| Role | nvarchar(20) | NOT NULL |
| Gender | nvarchar(20) | NOT NULL |
| IsEmailVerified | bit | NOT NULL |
| IsUniversityVerified | bit | NOT NULL |
| ProfilePhotoUrl | nvarchar(500) | NULL |
| University | nvarchar(20) | NULL |
| CreatedAt | datetime2 | NOT NULL |
| IsBanned | bit | NOT NULL |
| EmailVerificationTokenHash | nvarchar(128) | NULL |
| EmailVerificationTokenExpiresAt | datetime2 | NULL |
| PasswordResetTokenHash | nvarchar(128) | NULL |
| PasswordResetTokenExpiresAt | datetime2 | NULL |
| PendingUniversityEmail | nvarchar(254) | NULL |
| UniversityVerificationTokenHash | nvarchar(128) | NULL |
| UniversityVerificationTokenExpiresAt | datetime2 | NULL |

#### StudentProfiles
| Column | Type | Constraints |
|--------|------|-------------|
| Id | uniqueidentifier | PK |
| UserId | uniqueidentifier | FK → Users, UNIQUE, CASCADE |
| Bio | nvarchar(1000) | NULL |
| Year | int | NOT NULL |
| Major | nvarchar(120) | NOT NULL |
| QuizCompleted | bit | NOT NULL |

#### QuizAnswers
| Column | Type | Constraints |
|--------|------|-------------|
| Id | uniqueidentifier | PK |
| StudentProfileId | uniqueidentifier | FK → StudentProfiles, CASCADE |
| QuestionKey | nvarchar(30) | NOT NULL |
| AnswerValue | nvarchar(40) | NOT NULL |
| | | UNIQUE(StudentProfileId, QuestionKey) |

#### Apartments
| Column | Type | Constraints |
|--------|------|-------------|
| Id | uniqueidentifier | PK |
| OwnerId | uniqueidentifier | FK → Users, RESTRICT |
| Title | nvarchar(140) | NOT NULL |
| Description | nvarchar(4000) | NOT NULL |
| City | nvarchar(20) | NOT NULL |
| Neighborhood | nvarchar(120) | NOT NULL |
| AddressDetail | nvarchar(500) | NOT NULL |
| Latitude | float | NOT NULL |
| Longitude | float | NOT NULL |
| FullRent | decimal(10,2) | NOT NULL |
| TotalSpots | int | NOT NULL |
| AvailableSpots | int | NOT NULL |
| GenderType | nvarchar(20) | NOT NULL |
| IsFurnished | bit | NOT NULL |
| NearestUniversity | nvarchar(20) | NOT NULL |
| DistanceMinutes | int | NOT NULL |
| SmokingRule | nvarchar(20) | NOT NULL |
| GuestsRule | nvarchar(20) | NOT NULL |
| IsFeatured | bit | NOT NULL |
| FeaturedUntil | datetime2 | NULL |
| IsActive | bit | NOT NULL |
| IsSuspended | bit | NOT NULL |
| CreatedAt | datetime2 | NOT NULL |

#### ApartmentAmenities
| Column | Type | Constraints |
|--------|------|-------------|
| Id | uniqueidentifier | PK |
| ApartmentId | uniqueidentifier | FK → Apartments, CASCADE |
| AmenityType | nvarchar(30) | NOT NULL |
| | | UNIQUE(ApartmentId, AmenityType) |

#### ApartmentPhotos
| Column | Type | Constraints |
|--------|------|-------------|
| Id | uniqueidentifier | PK |
| ApartmentId | uniqueidentifier | FK → Apartments, CASCADE |
| PhotoUrl | nvarchar(500) | NOT NULL |
| DisplayOrder | int | NOT NULL |

#### Applications
| Column | Type | Constraints |
|--------|------|-------------|
| Id | uniqueidentifier | PK |
| ApartmentId | uniqueidentifier | FK → Apartments, CASCADE |
| StudentId | uniqueidentifier | FK → Users, RESTRICT |
| Message | nvarchar(500) | NOT NULL |
| CompatibilityScore | int | NOT NULL |
| Status | nvarchar(20) | NOT NULL |
| CreatedAt | datetime2 | NOT NULL |
| RespondedAt | datetime2 | NULL |

#### Tenancies
| Column | Type | Constraints |
|--------|------|-------------|
| Id | uniqueidentifier | PK |
| ApartmentId | uniqueidentifier | FK → Apartments, RESTRICT |
| StudentId | uniqueidentifier | FK → Users, RESTRICT |
| StartDate | datetime2 | NOT NULL |
| EndDate | datetime2 | NULL |
| Status | nvarchar(20) | NOT NULL |

#### Conversations
| Column | Type | Constraints |
|--------|------|-------------|
| Id | uniqueidentifier | PK |
| Participant1Id | uniqueidentifier | FK → Users, RESTRICT |
| Participant2Id | uniqueidentifier | FK → Users, RESTRICT |
| ApartmentId | uniqueidentifier | FK → Apartments, RESTRICT |
| LastMessageAt | datetime2 | NOT NULL |
| | | UNIQUE(Participant1Id, Participant2Id, ApartmentId) |

#### Messages
| Column | Type | Constraints |
|--------|------|-------------|
| Id | uniqueidentifier | PK |
| ConversationId | uniqueidentifier | FK → Conversations, CASCADE |
| SenderId | uniqueidentifier | FK → Users, RESTRICT |
| Content | nvarchar(4000) | NOT NULL |
| IsRead | bit | NOT NULL |
| SentAt | datetime2 | NOT NULL |

#### Ratings
| Column | Type | Constraints |
|--------|------|-------------|
| Id | uniqueidentifier | PK |
| RaterId | uniqueidentifier | FK → Users, RESTRICT |
| RatedUserId | uniqueidentifier | FK → Users, RESTRICT |
| ApartmentId | uniqueidentifier | FK → Apartments, RESTRICT |
| Stars | int | NOT NULL (1–5) |
| Comment | nvarchar(1000) | NULL |
| CreatedAt | datetime2 | NOT NULL |
| | | UNIQUE(RaterId, RatedUserId, ApartmentId) |

#### SavedListings
| Column | Type | Constraints |
|--------|------|-------------|
| Id | uniqueidentifier | PK |
| StudentId | uniqueidentifier | FK → Users, CASCADE |
| ApartmentId | uniqueidentifier | FK → Apartments, CASCADE |
| CreatedAt | datetime2 | NOT NULL |
| | | UNIQUE(StudentId, ApartmentId) |

#### Reports
| Column | Type | Constraints |
|--------|------|-------------|
| Id | uniqueidentifier | PK |
| ReporterId | uniqueidentifier | FK → Users, RESTRICT |
| ReportedApartmentId | uniqueidentifier | FK → Apartments, CASCADE |
| Reason | nvarchar(30) | NOT NULL |
| Description | nvarchar(2000) | NULL |
| Status | nvarchar(20) | NOT NULL |
| CreatedAt | datetime2 | NOT NULL |
| ResolvedAt | datetime2 | NULL |
| ResolvedByAdminId | uniqueidentifier | FK → Users, SET NULL |

#### Payments
| Column | Type | Constraints |
|--------|------|-------------|
| Id | uniqueidentifier | PK |
| UserId | uniqueidentifier | FK → Users, RESTRICT |
| Type | nvarchar(30) | NOT NULL |
| Amount | decimal(10,2) | NOT NULL |
| Status | nvarchar(20) | NOT NULL |
| TransactionRef | nvarchar(80) | NULL |
| CreatedAt | datetime2 | NOT NULL |

#### Notifications
| Column | Type | Constraints |
|--------|------|-------------|
| Id | uniqueidentifier | PK |
| UserId | uniqueidentifier | FK → Users, CASCADE |
| Type | nvarchar(40) | NOT NULL |
| Title | nvarchar(140) | NOT NULL |
| Content | nvarchar(1000) | NOT NULL |
| IsRead | bit | NOT NULL |
| RelatedEntityId | uniqueidentifier | NULL |
| CreatedAt | datetime2 | NOT NULL |

#### RefreshTokens
| Column | Type | Constraints |
|--------|------|-------------|
| Id | uniqueidentifier | PK |
| UserId | uniqueidentifier | FK → Users, CASCADE |
| TokenHash | nvarchar(128) | NOT NULL, UNIQUE |
| CreatedAt | datetime2 | NOT NULL |
| ExpiresAt | datetime2 | NOT NULL |
| RevokedAt | datetime2 | NULL |
| ReplacedByTokenId | uniqueidentifier | FK → RefreshTokens, NO ACTION |

### 4.3 Relationships

| Relationship | Type | Delete Behavior |
|-------------|------|-----------------|
| User → StudentProfile | One-to-One | Cascade |
| StudentProfile → QuizAnswers | One-to-Many | Cascade |
| User → Apartments (Owner) | One-to-Many | Restrict |
| Apartment → Amenities | One-to-Many | Cascade |
| Apartment → Photos | One-to-Many | Cascade |
| Apartment → Tenancies | One-to-Many | Restrict |
| User → Tenancies (Student) | One-to-Many | Restrict |
| Apartment → Applications | One-to-Many | Cascade |
| User → Applications (Student) | One-to-Many | Restrict |
| User → Conversations (P1/P2) | One-to-Many | Restrict |
| Apartment → Conversations | One-to-Many | Restrict |
| Conversation → Messages | One-to-Many | Cascade |
| User → Messages (Sender) | One-to-Many | Restrict |
| User → Ratings (Rater/Rated) | One-to-Many | Restrict |
| Apartment → Ratings | One-to-Many | Restrict |
| User → SavedListings | One-to-Many | Cascade |
| Apartment → SavedListings | One-to-Many | Cascade |
| User → Reports (Reporter) | One-to-Many | Restrict |
| Apartment → Reports | One-to-Many | Cascade |
| User → Reports (Admin) | One-to-Many | Set Null |
| User → Payments | One-to-Many | Restrict |
| User → Notifications | One-to-Many | Cascade |
| User → RefreshTokens | One-to-Many | Cascade |
| RefreshToken → RefreshToken | Self-ref | No Action |

### 4.4 ERD (Entity Relationship Diagram)

```
┌──────────┐  1:1  ┌────────────────┐  1:N  ┌─────────────┐
│  Users   │──────►│ StudentProfiles │──────►│ QuizAnswers │
└────┬─────┘       └────────────────┘       └─────────────┘
     │
     │  1:N (as Owner)
     ▼
┌──────────────┐  1:N  ┌────────────────────┐
│  Apartments  │──────►│ ApartmentAmenities │
│              │──────►│ ApartmentPhotos    │
│              │       └────────────────────┘
│              │
│              │──────►┌─────────────┐◄──── Users (Student)
│              │  1:N  │  Tenancies  │
│              │       └─────────────┘
│              │
│              │──────►┌──────────────┐◄──── Users (Student)
│              │  1:N  │ Applications │
│              │       └──────────────┘
│              │
│              │──────►┌───────────────┐  1:N  ┌──────────┐
│              │  1:N  │ Conversations │──────►│ Messages │
│              │       │ (P1, P2, Apt) │       └──────────┘
│              │       └───────────────┘
│              │
│              │──────►┌─────────┐       ──────►┌──────────────┐
│              │  1:N  │ Ratings │       │ 1:N  │SavedListings │
│              │       └─────────┘       │      └──────────────┘
│              │                         │
│              │──────►┌─────────┐       │──────►┌──────────┐
└──────────────┘  1:N  │ Reports │       │       │ Payments │
                       └─────────┘       │       └──────────┘
                                         │
                  Users ─────────────────►┤──────►┌───────────────┐
                                         │       │ Notifications │
                                         │       └───────────────┘
                                         │
                                         └──────►┌───────────────┐
                                                 │ RefreshTokens │
                                                 └───────────────┘
```

### 4.5 Key Design Decisions

1. **Enums stored as strings** — All enum columns are stored as `nvarchar` for readability when querying in SSMS.
2. **Soft deletes for users** — `IsBanned` flag instead of physical deletion to preserve referential integrity.
3. **RESTRICT on shared-parent FKs** — Avoids SQL Server's "multiple cascade paths" error.
4. **Snapshot compatibility score** — `Application.CompatibilityScore` captures the score at submission time so it doesn't change as tenants come and go.
5. **Self-referential refresh tokens** — `ReplacedByTokenId` creates a traceable rotation chain with NO ACTION delete to avoid cascade cycles.
