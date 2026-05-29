# Dorm — Project Report

---

## 1. Project Overview

### 1.1 Project Idea

**Dorm** is a web application that helps Jordanian university students find apartments near campus and get matched with compatible roommates through a weighted lifestyle quiz. Three roles use the platform: Students browse and apply, Owners list apartments and review applicants, and Admins moderate the platform.

### 1.2 Purpose

| Problem | How Dorm Solves It |
|---------|-------------------|
| Hard to find housing near universities | Filterable apartment search with map view, city/university/price/amenity filters across 8 cities and 20 universities |
| Risk of incompatible roommates | 8-question lifestyle quiz produces a compatibility percentage with current tenants |
| Scattered communication | In-app messaging, application tracking, and notifications in one place |
| No trust or transparency | University-verified badges, testimonials, ratings, and private addresses released only after acceptance |

### 1.3 Main Features

1. **Authentication** — Register (Student/Owner), JWT tokens, email verification, university-verified badge, forgot/reset password, role-based access.
2. **Lifestyle Quiz** — 8 questions (Sleep, Cleanliness, Smoking, Study, Social, Guests, Cooking, Pets). Required before applying.
3. **Compatibility Algorithm** — Weighted scoring (total = 100). Same answer = full weight, adjacent = half, opposite = 0. Averaged across tenants. No tenants = 100%.
4. **Apartment Listings** — Owners create listings with photos (up to 10), rent, spots, amenities, house rules, gender policy, and map location. First listing is free; additional listings cost 10 JOD.
5. **Browse & Search** — Filters (city, university, price range, spots, furnished, amenities, distance), sorting (newest, price asc/desc), list/map toggle, pagination. Gender-filtered at API level.
6. **Privacy Controls** — Address and phone hidden until application is accepted. Tenant info shows first name + year + major only.
7. **Application Flow** — Students apply with a message (20–500 chars). Owners accept (creates tenancy, unlocks info) or reject. Students can withdraw pending applications.
8. **Messaging** — Two-party conversations per apartment. Read receipts. Polling-based updates.
9. **Notifications** — In-app bell with unread count. Covers applications, messages, ratings, and suspensions.
10. **Ratings** — 1–5 stars + optional comment after tenancy ends. One per (rater, rated, apartment).
11. **Reports & Moderation** — Users report listings with a reason. 3 pending reports auto-suspend a listing. Admin can dismiss (lifts suspension) or resolve.
12. **Payments (Mocked)** — Match Commission 15 JOD, Listing Fee 10 JOD (first listing free), Verified Badge 2 JOD/month. Mock gateway simulates ~1s latency and returns success.
13. **Admin Panel** — Dashboard stats, user management (ban/unban), listing management (suspend/activate), reports queue, testimonial management (approve/delete).
14. **Testimonials** — Users write reviews (1–5 stars, 10–500 chars, one per user). Admin approves before display. Approved testimonials shown on the homepage as a horizontal scrolling carousel.
15. **Saved Apartments** — Students can save/unsave listings and view them on a dedicated page.
16. **Suggested Apartments** — Logged-in students see apartments near their university on the homepage.

### 1.4 Target Users

| Role | Description |
|------|-------------|
| **Student** | University students who complete the quiz, browse apartments, view compatibility scores, apply, message owners, save favorites, and rate owners after tenancy. |
| **Owner** | Property owners who list apartments (first free, then 10 JOD each), review applications with compatibility scores, accept/reject, and communicate with students. |
| **Admin** | Platform administrators who moderate listings, manage users, review reports, approve testimonials, and monitor revenue. |

---

## 2. Functional Requirements

### 2.1 Authentication & Authorization

| ID | Requirement |
|----|-------------|
| FR-AUTH-01 | Users register with name, email, password, role (Student/Owner), gender, phone, and optional university (20 universities supported). |
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
| FR-STU-14 | Save/favorite apartment listings and view them on a dedicated Saved page. |
| FR-STU-15 | Rate owners (1–5 stars) after tenancy ends. |
| FR-STU-16 | Report listings with a reason. |
| FR-STU-17 | Pay Match Commission (15 JOD) after acceptance. |
| FR-STU-18 | Write a testimonial (one per user, admin-approved). |

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
| FR-OWN-09 | First apartment listing is free. Additional listings require a 10 JOD Listing Fee. |
| FR-OWN-10 | Receive notifications for new applications and messages. |

### 2.4 Admin Features

| ID | Requirement |
|----|-------------|
| FR-ADM-01 | Dashboard with stats: users, listings, tenancies, reports, revenue breakdown. |
| FR-ADM-02 | Search/filter users by role, ban/unban accounts. |
| FR-ADM-03 | Search/filter listings by status, suspend/activate. |
| FR-ADM-04 | Review reports queue, dismiss or resolve. Dismissing last pending report lifts suspension. |
| FR-ADM-05 | 3 pending reports auto-suspend a listing. |
| FR-ADM-06 | Manage testimonials: view all, approve, or delete. |

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
| Testimonial | POST | GET approved/all | Approve (admin) | DELETE (admin) |
| SavedListing | POST toggle | GET list/IDs | — | Toggle removes |

---

## 3. Non-Functional Requirements

### 3.1 Performance

| ID | Requirement |
|----|-------------|
| NFR-PERF-01 | Pagination clamped to 1–50 items per page. |
| NFR-PERF-02 | Database indexes on frequently filtered columns (city, university, gender, price, spots, status). |
| NFR-PERF-03 | Compatibility scores computed via batch queries to minimize round-trips. |
| NFR-PERF-04 | Message polling at 10s intervals, conversation list at 15s. |

### 3.2 Security

| ID | Requirement |
|----|-------------|
| NFR-SEC-01 | Passwords hashed with BCrypt. |
| NFR-SEC-02 | JWT signed with HMAC-SHA256 (32+ byte key). |
| NFR-SEC-03 | Refresh tokens stored as SHA-256 hashes (not raw). |
| NFR-SEC-04 | All verification/reset tokens stored as SHA-256 hashes with expiry. |
| NFR-SEC-05 | Refresh token rotation enforced. Password reset revokes all tokens. |
| NFR-SEC-06 | All inputs validated with FluentValidation on the backend. |
| NFR-SEC-07 | File uploads: jpg/png/webp only, max 5 MB. |
| NFR-SEC-08 | Ownership checks on all owner operations. |
| NFR-SEC-09 | Forgot-password returns same response regardless of email existence. |
| NFR-SEC-10 | XSS prevention via HTML escaping on all user-generated content rendered in views. |

### 3.3 Usability

| ID | Requirement |
|----|-------------|
| NFR-USE-01 | English language interface. |
| NFR-USE-02 | Designed empty states with icons and call-to-action on every list page. |
| NFR-USE-03 | Skeleton loaders for content, spinners for actions. |
| NFR-USE-04 | Clear, specific error messages — no generic "Something went wrong." |
| NFR-USE-05 | Brand color #F97316 (orange), rounded corners, soft shadows, Inter font. |
| NFR-USE-06 | Responsive design for desktop and mobile. |

### 3.4 Scalability & Architecture

| ID | Requirement |
|----|-------------|
| NFR-SCA-01 | Clean Architecture: API, Application, Domain, Infrastructure layers. |
| NFR-SCA-02 | File storage behind `IFileStorage` abstraction (swappable to cloud). |
| NFR-SCA-03 | Payments behind `IPaymentService` abstraction (swappable to real provider). |
| NFR-SCA-04 | Email behind `IEmailService` abstraction (swappable to SMTP/SendGrid). |
| NFR-SCA-05 | DTOs everywhere — entities never exposed through controllers. |

### 3.5 Reliability

| ID | Requirement |
|----|-------------|
| NFR-REL-01 | Global exception middleware returns structured JSON errors `{ error: { code, message, details? } }` — no raw stack traces. |
| NFR-REL-02 | Serilog structured logging with request IDs, user IDs, and routes. |
| NFR-REL-03 | Database bootstrap is idempotent (safe to re-run). |
| NFR-REL-04 | Demo seeder is idempotent (marker-user guard). |

---

## 4. Technology Stack

| Layer | Technology | Version / Notes |
|-------|-----------|-----------------|
| Backend Framework | ASP.NET Core (MVC + Web API) | .NET 9 |
| ORM | Entity Framework Core | Code-First with migrations |
| Database | SQL Server (LocalDB) | `(localdb)\MSSQLLocalDB` |
| Authentication | JWT Bearer (BCrypt + HS256) | 1h access + 7d refresh tokens |
| Validation | FluentValidation | On every request DTO |
| Mapping | AutoMapper | DTOs ↔ entities |
| Logging | Serilog | Console + rolling file sink |
| API Docs | Swashbuckle (Swagger) | `/swagger` |
| Frontend | Razor Views (MVC) | Server-rendered with client-side JS |
| CSS/UI | Bootstrap 5 + custom CSS | CDN-loaded, Inter font |
| Icons | Bootstrap Icons | CDN-loaded |
| Maps | Leaflet.js | Apartment detail + browse map view |
| Landing Template | Property theme | Public/home pages |

---

## 5. Database Design

### 5.1 Connection

| Item | Value |
|------|-------|
| Database Engine | SQL Server (LocalDB) |
| ORM | Entity Framework Core (Code-First) |
| Connection String | `Server=(localdb)\MSSQLLocalDB;Database=dorm;Trusted_Connection=True` |
| Migrations | Auto-applied on startup via `DatabaseBootstrap` |

### 5.2 Database Schema

#### Users
| Column | Type | Constraints |
|--------|------|-------------|
| Id | uniqueidentifier | PK |
| FullName | nvarchar(120) | NOT NULL |
| Email | nvarchar(254) | NOT NULL, UNIQUE |
| PasswordHash | nvarchar(255) | NOT NULL |
| PhoneNumber | nvarchar(40) | NOT NULL |
| Role | nvarchar(20) | NOT NULL (Student / Owner / Admin) |
| Gender | nvarchar(20) | NOT NULL (Male / Female) |
| IsEmailVerified | bit | NOT NULL |
| IsUniversityVerified | bit | NOT NULL |
| ProfilePhotoUrl | nvarchar(500) | NULL |
| University | nvarchar(20) | NULL (enum: 20 universities) |
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
| City | nvarchar(20) | NOT NULL (enum: 8 cities) |
| Neighborhood | nvarchar(120) | NOT NULL |
| AddressDetail | nvarchar(500) | NOT NULL |
| Latitude | float | NOT NULL |
| Longitude | float | NOT NULL |
| FullRent | decimal(10,2) | NOT NULL |
| TotalSpots | int | NOT NULL |
| AvailableSpots | int | NOT NULL |
| GenderType | nvarchar(20) | NOT NULL (MaleOnly / FemaleOnly / Mixed) |
| IsFurnished | bit | NOT NULL |
| NearestUniversity | nvarchar(20) | NOT NULL (enum: 20 universities) |
| DistanceMinutes | int | NOT NULL |
| SmokingRule | nvarchar(20) | NOT NULL |
| GuestsRule | nvarchar(20) | NOT NULL |
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
| Status | nvarchar(20) | NOT NULL (Pending / Accepted / Rejected / Withdrawn) |
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
| Status | nvarchar(20) | NOT NULL (Active / Ended) |

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

#### Testimonials
| Column | Type | Constraints |
|--------|------|-------------|
| Id | uniqueidentifier | PK |
| UserId | uniqueidentifier | FK → Users |
| Text | nvarchar(500) | NOT NULL |
| Stars | int | NOT NULL (1–5) |
| IsApproved | bit | NOT NULL |
| CreatedAt | datetime2 | NOT NULL |

#### Reports
| Column | Type | Constraints |
|--------|------|-------------|
| Id | uniqueidentifier | PK |
| ReporterId | uniqueidentifier | FK → Users, RESTRICT |
| ReportedApartmentId | uniqueidentifier | FK → Apartments, CASCADE |
| Reason | nvarchar(30) | NOT NULL |
| Description | nvarchar(2000) | NULL |
| Status | nvarchar(20) | NOT NULL (Pending / Resolved / Dismissed) |
| CreatedAt | datetime2 | NOT NULL |
| ResolvedAt | datetime2 | NULL |
| ResolvedByAdminId | uniqueidentifier | FK → Users, SET NULL |

#### Payments
| Column | Type | Constraints |
|--------|------|-------------|
| Id | uniqueidentifier | PK |
| UserId | uniqueidentifier | FK → Users, RESTRICT |
| Type | nvarchar(30) | NOT NULL (MatchCommission / ListingFee / VerifiedBadge) |
| Amount | decimal(10,2) | NOT NULL |
| Status | nvarchar(20) | NOT NULL (Pending / Completed / Failed) |
| RelatedEntityId | uniqueidentifier | NULL (links to apartment for ListingFee) |
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

### 5.3 Relationships

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
| User → Testimonials | One-to-Many | Cascade |
| User → Reports (Reporter) | One-to-Many | Restrict |
| Apartment → Reports | One-to-Many | Cascade |
| User → Reports (Admin) | One-to-Many | Set Null |
| User → Payments | One-to-Many | Restrict |
| User → Notifications | One-to-Many | Cascade |
| User → RefreshTokens | One-to-Many | Cascade |
| RefreshToken → RefreshToken | Self-ref | No Action |

### 5.4 ERD (Entity Relationship Diagram)

```
┌──────────┐  1:1  ┌────────────────┐  1:N  ┌─────────────┐
│  Users   │──────►│ StudentProfiles │──────►│ QuizAnswers │
└────┬─────┘       └────────────────┘       └─────────────┘
     │
     ├──► Testimonials (1:N)
     ├──► SavedListings (1:N)
     ├──► Payments (1:N)
     ├──► Notifications (1:N)
     ├──► RefreshTokens (1:N)
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
│              │──────►┌─────────┐
│              │  1:N  │ Ratings │◄──── Users (Rater, Rated)
│              │       └─────────┘
│              │
│              │──────►┌─────────┐
│              │  1:N  │ Reports │◄──── Users (Reporter, Admin)
│              │       └─────────┘
│              │
│              │──────►┌──────────────┐
└──────────────┘  1:N  │SavedListings │◄──── Users (Student)
                       └──────────────┘
```

### 5.5 Key Design Decisions

1. **Enums stored as strings** — All enum columns are stored as `nvarchar` for readability when querying the database directly.
2. **Soft deletes for users** — `IsBanned` flag instead of physical deletion to preserve referential integrity.
3. **RESTRICT on shared-parent FKs** — Avoids SQL Server's "multiple cascade paths" error.
4. **Snapshot compatibility score** — `Application.CompatibilityScore` captures the score at submission time so it doesn't change as tenants come and go.
5. **Self-referential refresh tokens** — `ReplacedByTokenId` creates a traceable rotation chain with NO ACTION delete to avoid cascade cycles.
6. **First listing free** — Owner's first apartment listing requires no payment. Subsequent listings require a 10 JOD ListingFee payment (tracked via `Payment.RelatedEntityId` linking to the apartment).
7. **Payment abstraction** — `MockPaymentService` returns success after ~1s simulated latency. Swapping to real CliQ is a one-line DI change.

---

## 6. Domain Reference

### 6.1 Cities (8)

Amman, Irbid, Zarqa, Madaba, Salt, Karak, Mafraq, Aqaba.

### 6.2 Universities (20)

| # | Code | Full Name |
|---|------|-----------|
| 0 | JU | University of Jordan |
| 1 | GJU | German Jordanian University |
| 2 | PSUT | Princess Sumaya University |
| 3 | YU | Yarmouk University |
| 4 | HU | Hashemite University |
| 5 | MU | Mutah University |
| 6 | ZU | Zarqa University |
| 7 | BAU | Al-Balqa Applied University |
| 8 | JUST | Jordan University of Science & Technology |
| 9 | AAU | Amman Arab University |
| 10 | AABU | Al-Ahliyya Amman University |
| 11 | UOP | University of Petra |
| 12 | MEU | Middle East University |
| 13 | ASU | Applied Science University |
| 14 | WISE | World Islamic Sciences University |
| 15 | PU | Philadelphia University |
| 16 | Isra | Isra University |
| 17 | Jadara | Jadara University |
| 18 | Tafila | Tafila Technical University |
| 19 | AHU | Al-Hussein Bin Talal University |

### 6.3 Amenities

WiFi, AC, Heating, WashingMachine, Parking, Furnished, Elevator, Balcony, Kitchen, PrivateBathroom.

### 6.4 Compatibility Quiz Weights (sum = 100)

| Question | Weight | Adjacent Values |
|----------|--------|-----------------|
| Smoking | 25 | Outside adjacent to both No and Yes |
| Cleanliness | 20 | Average adjacent to VeryTidy and Relaxed |
| SleepSchedule | 15 | Flexible adjacent to EarlyBird and NightOwl |
| PetTolerance | 10 | Tolerate adjacent to LovePets and PreferNoPets |
| StudyHabits | 10 | Library adjacent to QuietAtHome and GroupAtHome |
| Guests | 8 | Sometimes adjacent to Often and Rarely |
| SocialStyle | 7 | Balanced adjacent to Introvert and Extrovert |
| Cooking | 5 | CookSometimes adjacent to CookALot and MostlyEatOut |

### 6.5 Payment Types

| Type | Amount | Who Pays | When |
|------|--------|----------|------|
| MatchCommission | 15 JOD | Student | After application is accepted |
| ListingFee | 10 JOD | Owner | Before creating 2nd+ listing (first is free) |
| VerifiedBadge | 2 JOD/month | Owner | Optional subscription |

---

## 7. API Endpoints

### 7.1 Authentication

| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| POST | /api/auth/register | Public | Register a new user |
| POST | /api/auth/login | Public | Login, returns JWT + refresh token |
| POST | /api/auth/refresh | Public | Rotate refresh token |
| POST | /api/auth/forgot-password | Public | Send password reset email |
| POST | /api/auth/reset-password | Public | Reset password with token |
| POST | /api/auth/verify-email | Public | Verify email with token |
| POST | /api/auth/verify-university | Auth | Verify university email |
| GET | /api/users/me | Auth | Get current user profile |
| PUT | /api/users/me | Auth | Update profile (name, phone, university) |

### 7.2 Apartments

| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | /api/apartments | Public | Browse with filters + pagination |
| GET | /api/apartments/{id} | Public | Apartment detail (gender-filtered) |
| GET | /api/apartments/mine | Owner | Owner's own listings |
| GET | /api/apartments/requires-listing-fee | Owner | Check if listing fee is needed |
| GET | /api/apartments/{id}/compatibility | Student | Compatibility breakdown |
| POST | /api/apartments | Owner | Create listing |
| PUT | /api/apartments/{id} | Owner | Update listing |
| DELETE | /api/apartments/{id} | Owner | Delete listing |
| POST | /api/apartments/{id}/photos | Owner | Upload photo |
| DELETE | /api/apartments/{id}/photos/{photoId} | Owner | Delete photo |

### 7.3 Quiz

| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | /api/quiz/questions | Public | Get quiz questions + options |
| GET | /api/quiz/answers | Student | Get student's answers |
| POST | /api/quiz/answers | Student | Submit/replace answers |

### 7.4 Applications

| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| POST | /api/apartments/{id}/apply | Student | Apply to apartment |
| GET | /api/applications/mine | Student | Student's applications |
| PUT | /api/applications/{id}/withdraw | Student | Withdraw pending application |
| GET | /api/applications/received | Owner | Owner's received applications |
| PUT | /api/applications/{id}/accept | Owner | Accept application |
| PUT | /api/applications/{id}/reject | Owner | Reject application |

### 7.5 Messaging

| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | /api/conversations | Auth | List conversations |
| GET | /api/conversations/{id}/messages | Auth | Get messages in conversation |
| POST | /api/conversations/{id}/messages | Auth | Send message |
| PUT | /api/conversations/{id}/read | Auth | Mark conversation as read |

### 7.6 Notifications, Ratings, Reports, Payments

| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | /api/notifications | Auth | Get notifications |
| PUT | /api/notifications/{id}/read | Auth | Mark notification read |
| PUT | /api/notifications/read-all | Auth | Mark all read |
| POST | /api/ratings | Auth | Submit rating |
| GET | /api/users/{id}/ratings | Public | Get user's ratings |
| POST | /api/reports | Auth | Report a listing |
| POST | /api/payments/checkout | Auth | Process payment |
| GET | /api/payments/history | Auth | Payment history |

### 7.7 Testimonials & Saved

| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | /api/testimonials/approved | Public | Approved testimonials |
| GET | /api/testimonials/all | Admin | All testimonials |
| POST | /api/testimonials | Auth | Write testimonial (one per user) |
| PUT | /api/testimonials/{id}/approve | Admin | Approve testimonial |
| DELETE | /api/testimonials/{id} | Admin | Delete testimonial |
| GET | /api/saved | Student | Saved apartments list |
| GET | /api/saved/ids | Student | Saved apartment IDs only |
| POST | /api/saved/{apartmentId} | Student | Toggle save/unsave |

### 7.8 Admin

| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | /api/admin/dashboard | Admin | Dashboard statistics |
| GET | /api/admin/users | Admin | User list with search + role filter |
| PUT | /api/admin/users/{id}/ban | Admin | Ban user |
| PUT | /api/admin/users/{id}/unban | Admin | Unban user |
| GET | /api/admin/listings | Admin | Listings with search + status filter |
| PUT | /api/admin/listings/{id}/suspend | Admin | Suspend listing |
| PUT | /api/admin/listings/{id}/activate | Admin | Activate listing |
| GET | /api/admin/reports | Admin | Reports queue |
| PUT | /api/admin/reports/{id}/resolve | Admin | Resolve/dismiss report |

---

## 8. Project Structure

```
FinalProject/
├── docs/
│   ├── BUILD_BRIEF.md              ← Source of truth
│   └── ProjectReport.md           ← This file
├── backend/
│   ├── Dorm.slnx                  ← Solution file
│   ├── Dorm.API/                  ← Controllers (API + MVC), Views, wwwroot, Middleware
│   │   ├── Controllers/
│   │   │   ├── Api/               ← REST API controllers
│   │   │   └── Mvc/               ← Page controllers (Home, Browse, Profile, etc.)
│   │   ├── Views/                 ← Razor views
│   │   │   ├── Shared/            ← Layouts (_PublicLayout, _BrowseLayout, _AuthLayout, _DashboardLayout)
│   │   │   ├── Home/              ← Landing page
│   │   │   ├── Browse/            ← Apartment search
│   │   │   ├── Apartment/         ← Detail page
│   │   │   ├── Account/           ← Login, Register
│   │   │   ├── Profile/           ← Edit profile
│   │   │   ├── Saved/             ← Saved apartments
│   │   │   ├── WriteReview/       ← Write testimonial
│   │   │   ├── About/             ← About & Contact
│   │   │   ├── Admin/             ← Admin panel
│   │   │   └── Payment/           ← Payment history
│   │   ├── wwwroot/
│   │   │   ├── js/                ← auth.js, api.js, utils.js, nav.js, i18n.js
│   │   │   ├── css/               ← dorm-public.css
│   │   │   ├── locales/           ← en.json
│   │   │   ├── uploads/           ← User-uploaded apartment photos
│   │   │   └── property/          ← Landing page template assets
│   │   └── Middleware/            ← GlobalExceptionMiddleware, ValidationFilter
│   ├── Dorm.Application/          ← DTOs, Services, Validators, Mapping, Abstractions
│   ├── Dorm.Domain/               ← Entities, Enums
│   ├── Dorm.Infrastructure/       ← DbContext, Migrations, Identity, Storage, Payments, Email, Seed
│   └── tests/
│       └── Dorm.Application.Tests/ ← 29 xUnit tests for compatibility algorithm
└── CLAUDE.md
```

---

## 9. Seeded Demo Data

The seeder (`DataSeeder`) runs when `Dorm__Seed=true` and is idempotent.

| Data | Count | Details |
|------|-------|---------|
| Admin | 1 | `admin@dorm.jo` / `Admin123!` |
| Owners | 10 | `*.owner.seed@dorm.jo` / `Owner123!` |
| Students | 20 | `student*.seed@*.edu.jo` / `Student123!` |
| Apartments | 30 | Across multiple cities and universities |
| Tenancies | 10 | Active tenancies |
| Applications | 8 | Pending applications |
| Conversations | 4 | With messages |
| Ratings | 2 | Owner ratings |

---

## 10. Mocked Services

| Service | Interface | Mock Implementation | Production Replacement |
|---------|-----------|--------------------|-----------------------|
| Payments | `IPaymentService` | `MockPaymentService` — ~1s delay, always succeeds | CliQ integration |
| Email | `IEmailService` | `DevEmailService` — logs verification/reset links to console | SMTP / SendGrid |
| File Storage | `IFileStorage` | `LocalFileStorage` — saves to `wwwroot/uploads/` | Cloudinary / Azure Blob |
