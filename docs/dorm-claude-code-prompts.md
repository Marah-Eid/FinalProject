# Dorm — Claude Code Prompt Kit

A ready-to-use prompt set for building the **Dorm** bilingual roommate/apartment platform with Claude Code.

---

## How to use this (read first)

1. **Save the build brief into the repo.** Create an empty folder, then save your full spec there as `docs/BUILD_BRIEF.md`. The prompts below tell Claude Code to read it — this keeps the spec out of the chat (where it gets forgotten) and in the repo (where it stays the source of truth).

2. **Start a Claude Code session in that folder** and paste **Prompt 0 (Kickoff)**. Let it produce the plan, `CLAUDE.md`, and scaffolding. Review them.

3. **Then drive it phase by phase** using the continuation prompts. Don't try to one-shot the whole app — review and run each phase before moving on. After each phase: run the backend, run the frontend, and confirm the slice works before saying "continue."

4. **Keep `CLAUDE.md` updated.** It's Claude Code's memory between turns. If it drifts, point it back at `CLAUDE.md` and `docs/BUILD_BRIEF.md`.

> Version note: tell it to use the **latest stable** of each tool. As of now that means **Tailwind CSS v4** (CSS-first config via `@import "tailwindcss"` and an `@theme` block — there is no `tailwind.config.js` by default; RTL still works via `dir="rtl"` and logical utilities), **React 19**, **Vite (latest)**, and **.NET 10 (LTS)** for the backend.
>
> **About the .NET version:** .NET 10 is the current LTS (released Nov 2025, supported to Nov 2028) and is Microsoft's recommended production version. .NET 8 and .NET 9 both reach end of support on **Nov 10, 2026** — within months of now — so .NET 8 is a poor default for a project built and defended in 2026. The kit below targets **.NET 10**. **Only** change it to `net8.0` if your university/examiners explicitly require .NET 8 — if so, that's the single toggle: replace `net10.0` with `net8.0` in the kickoff prompt (the rest of the stack is version-agnostic).

---

## Prompt 0 — Kickoff (paste this first)

```
You are building a real, production-quality graduation project called "Dorm" — a bilingual (Arabic/English, full RTL) full-stack web app that helps Jordanian university students find apartments near campus and get matched with compatible roommates.

FIRST, before writing any code:
1. Read `docs/BUILD_BRIEF.md` in full. It is the complete, authoritative spec — entities, endpoints, pages, rules, seed data, everything. Treat it as the source of truth and do not invent features that contradict it.
2. Produce a short written PLAN: the phase order you'll follow (use the brief's "Build Order Recommendation"), and the monorepo folder layout you'll create.
3. Create a `CLAUDE.md` at the repo root capturing: the tech stack + exact versions, the folder structure, build/run commands for backend and frontend, the non-negotiable rules listed below, and a checklist of phases with checkboxes. You will keep this file updated as you complete work — it is your memory across turns.
4. Initialize git and commit after each phase with a clear message.

Then STOP and show me the plan, the layout, and CLAUDE.md before scaffolding. I'll say "go" to start Phase 0.

TECH STACK (use latest stable unless pinned):
- Frontend: React 19 + Vite + TypeScript + Tailwind CSS v4 + React Router + TanStack Query + Axios + Leaflet + i18next + React Hook Form + Zod + lucide-react.
  (Tailwind v4 uses CSS-first config — `@import "tailwindcss"` + `@theme`, no tailwind.config.js by default.)
- Backend: ASP.NET Core Web API on .NET 10 (current LTS — target `net10.0`; do NOT use .NET 9) with EF Core, JWT auth (access 1h + refresh 7d), FluentValidation, AutoMapper, Serilog, Swashbuckle/Swagger.
- Database: PostgreSQL. Generate EF Core migrations.
- File storage: local /wwwroot/uploads/ for dev, with a clean interface so it can swap to Cloudinary/Azure Blob later.

ARCHITECTURE:
- Backend split into 4 projects exactly as the brief specifies: Dorm.API, Dorm.Application, Dorm.Domain, Dorm.Infrastructure, under one Dorm.sln.
- Never expose EF entities from controllers — DTOs everywhere, mapped with AutoMapper.
- Global error-handling middleware; structured logging with Serilog.
- Frontend organized into pages / components / features / hooks / services / context / utils / locales / styles as in the brief.

NON-NEGOTIABLE RULES (these are easy to get wrong — get them right):
1. COMPATIBILITY ALGORITHM is the heart of the app. Implement `CompatibilityService.CalculateScore(studentQuizAnswers, tenantsQuizAnswers)` in the backend exactly per the brief: per-question weights summing to 100 (Smoking 25, Cleanliness 20, Sleep 15, Pets 10, Study 10, Guests 8, Social 7, Cooking 5); same answer = full weight, adjacent/compatible = half weight, opposite = 0; apartment score = average of pairwise scores vs each current tenant; no tenants = 100%. Return the rounded percentage AND the per-question breakdown (match on / differ on). Write unit tests for it.
2. GENDER is NOT a quiz question and NOT a browse filter. Owners set apartment GenderType (MaleOnly / FemaleOnly / Mixed, single-gender is the default). Student gender is captured at signup. The API itself must filter out apartments that don't match the requesting student's gender (male → MaleOnly + Mixed; female → FemaleOnly + Mixed). The backend must never return mismatched apartments.
3. RELIGION / religion observance is REMOVED entirely — not in the quiz, filters, profile, or listings. Skip it everywhere.
4. PRIVACY: exact street address and phone number are hidden until an application is ACCEPTED (show neighborhood only); on the apartment page's "current tenants" section, show first name + year + major only — no profile photos.
5. PAYMENTS are mocked: an `IPaymentService` with a `MockPaymentService` that returns success after ~1s. Real CliQ documented as a next step in the README. Payment types: MatchCommission 15 JOD, FeaturedListing 10 JOD, VerifiedBadge 2 JOD/month.
6. BILINGUAL: default language Arabic, full RTL via <html dir="rtl" lang="ar">, all UI text through i18next (en.json/ar.json) — zero hardcoded strings — and Arabic-Indic numerals for dates when Arabic is active.

QUALITY BAR:
- Clean, idiomatic, commented code. Validate all inputs (FluentValidation backend, Zod frontend).
- Every list page gets a designed empty state, skeleton loaders, and clear error states (never just "Something went wrong").
- Mobile-first responsive; semantic HTML + ARIA + alt text.
- Design: primary orange #F97316, lots of whitespace, rounded-2xl, soft shadows; Inter (EN) + Tajawal/IBM Plex Sans Arabic (AR).
- If anything gets stuck, prioritize the core flow working flawlessly over peripheral features: signup → quiz → browse → see match score → apply → get accepted.

Confirm you've read docs/BUILD_BRIEF.md, then show me the plan, layout, and CLAUDE.md.
```

---

## Phase continuation prompts

Paste these one at a time, after reviewing and running the previous phase. After each, ask it to update `CLAUDE.md`'s checklist and commit.

### Prompt 1 — Backend foundation
```
Go with Phase 0/1 from the plan. Scaffold the monorepo and the 4 backend projects + solution. Then build: the full EF Core domain model and DbContext for every entity in the brief (User, StudentProfile, QuizAnswer, Apartment, ApartmentAmenity, ApartmentPhoto, Tenancy, Application, Conversation, Message, Rating, SavedListing, Report, Payment, Notification) with all enums; the initial migration; JWT auth (register with role+gender, login, refresh, email verification, university-email verification for @ju.edu.jo / @gju.edu.jo / @psut.edu.jo / @yu.edu.jo etc. → Verified Student badge, forgot/reset password); role-based authorization; Serilog; global error middleware; Swagger at /swagger. Wire up an appsettings + .env.example. Show me the migration and let me run it and hit /swagger before continuing.
```

### Prompt 2 — Frontend foundation
```
Phase 2: scaffold the Vite + React + TS + Tailwind v4 frontend with the folder structure from the brief. Set up React Router with all routes (public/student/owner/admin) and route guards by role, the Axios client with JWT + refresh-token interceptor, TanStack Query, i18next with en.json/ar.json and the Arabic-default + RTL toggle in the navbar, and the base layout (navbar with language globe + notification bell placeholder, footer). Build the auth pages (login, register with role+gender selection, forgot/reset password, verify-email) wired to the backend. Zod validation on every form. Make sure Arabic RTL actually flips the layout. Let me run it and log in before continuing.
```

### Prompt 3 — Apartments, photos, quiz (backend)
```
Phase 3 (backend): apartment CRUD (owner-only writes), multi-photo upload to /wwwroot/uploads with an IFileStorage interface, the quiz endpoints (GET questions, POST answers, GET my-answers) for the 8 questions exactly as specified, and the apartment browse endpoint with ALL filters/sort/pagination — including the automatic gender filtering at the API level and the privacy rules (hide address/phone until accepted). DTOs + AutoMapper + FluentValidation throughout. Show me the endpoints in Swagger.
```

### Prompt 4 — Browse, detail, quiz (frontend)
```
Phase 4 (frontend): the browse page with list/map (Leaflet) toggle, all filters, sort, and apartment cards (showing the X% match badge when a student with a completed quiz is logged in); the apartment detail page (gallery carousel, amenities, house rules, current-tenants cards per the privacy rules, neighborhood-level map, apply modal, save/report buttons); and the quiz page (take + update). Empty/loading/error states everywhere. Everything bilingual.
```

### Prompt 5 — Compatibility algorithm + display
```
Phase 5: implement CompatibilityService.CalculateScore exactly per the brief (weights, same/adjacent/opposite scoring, average across tenants, 100% if no tenants, per-question breakdown) plus the GET /api/apartments/{id}/compatibility endpoint. Write xUnit unit tests covering: identical answers = 100, opposite on a heavy question, the "Flexible"/"Sometimes" adjacency rules, multi-tenant averaging, and the empty-apartment case. Then build the frontend compatibility display: big circular percentage + "You match on…" / "You differ on…" breakdown on the detail page. Run the tests and show me the results.
```

### Prompt 6 — Applications, messaging, notifications
```
Phase 6: application flow (apply with ≤500-char message, owner accept/reject, on accept → status Accepted + AvailableSpots-1 + create Tenancy + unlock phone + prompt 15 JOD fee, other pending stay pending; on reject → polite notification); in-app messaging (conversations list + thread, 10s polling, read receipts, text-only); and the notification system (in-app bell dropdown + email for critical events). Wire the frontend student + owner dashboards and the messaging UI. Mock the email sender behind an interface for dev.
```

### Prompt 7 — Ratings, reports, payments, admin
```
Phase 7: ratings & reviews (on tenancy end, both parties rate 1–5 + comment; aggregate on owner listings + student applications); reports + moderation (report reasons, 3 valid reports auto-suspend, admin queue); payments via IPaymentService/MockPaymentService with the three payment types + payment history pages; and the full admin panel (/admin dashboard with stats + revenue chart, users table with ban/unban, listings table with suspend/reactivate, reports queue). Build the matching frontend pages.
```

### Prompt 8 — Bilingual polish, seed, README, final review
```
Phase 8 (final): audit for hardcoded strings (everything through i18next), verify full RTL on every page, and Arabic-Indic numerals for dates in Arabic. Write the seed script per the brief (1 admin admin@dorm.jo/Admin123!, 20 students with completed quizzes across genders+universities, 10 owners, 30 apartments across Amman/Irbid/Zarqa at 80–250 JOD/spot with varied amenities and genders, several active tenancies so compatibility scores are non-trivial, some pending applications, sample ratings + messages). Write the root README (description, stack, setup for backend/frontend/db, how to seed, default credentials, mock-payments→CliQ notes, local-storage→cloud notes) and .env.example files for both sides. Do a responsive pass on mobile. Then give me a short report of what's done vs. any gaps.
```

---

## Tips for keeping it on track

- **One phase per turn.** Run and eyeball each slice before continuing; it's far cheaper to catch a wrong pattern in Phase 1 than after Phase 7.
- **If it drifts or contradicts the spec,** reply: "Re-read the relevant section of docs/BUILD_BRIEF.md and CLAUDE.md, then fix X." 
- **If a tool errors on install/network,** the most common culprits are Postgres not running or a Node/.NET version mismatch — tell it your installed versions up front.
- **The compatibility algorithm and the API-level gender filter** are the two things examiners will poke at, and the two things models most often get subtly wrong. Read the generated code for both yourself.
- **Commit per phase** so you can roll back a bad phase without losing the good ones.
