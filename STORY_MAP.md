# Voting App — User Story Map

Next.js church voting platform · 9 features · Multi-admin + invite-only registration

**Progress: 9/9 features completed · 66/66 tasks done**

---

## Activity: Setup & Infrastructure

### F1 · Project Setup & Schema · ✅ Completed

Initialize Next.js, Prisma + PostgreSQL, and five-table schema: User, Invitation, Event, Participant, Vote. Seed super admin from env.

**Tasks**
- [x] Run: `npx create-next-app@latest` with TypeScript + Tailwind
- [x] Install Prisma + bcryptjs; configure PostgreSQL `DATABASE_URL`
- [x] Define full schema: User, Invitation, Event, Participant, Vote
- [x] Add `Role` and `InvitationStatus` enums + relations per plan
- [x] Run `prisma migrate dev --name init`
- [x] Create `prisma/seed.ts` for super admin (env vars)
- [x] Set up `/lib/prisma.ts` singleton client
- [x] Document env vars in `.env.example` (`DATABASE_URL`, `AUTH_SECRET`, super admin)

<details>
<summary>Development Plan</summary>

- Stack: Next.js App Router + TypeScript + Tailwind + Prisma + PostgreSQL.
- Prisma models (5 tables):
  - `User` — email, name, passwordHash, role (`SUPER_ADMIN` | `ADMIN`)
  - `Invitation` — token, email (optional), status, expiresAt; links invitedBy / usedBy / revokedBy
  - `Event` — slug, isActive, startsAt, endsAt, createdById → User
  - `Participant` — eventId, name, imageUrl, displayOrder (cascade delete)
  - `Vote` — eventId, participantId, voterKey, ipAddress, fingerprint; `@@unique([eventId, voterKey])`
- Enums: `Role`, `InvitationStatus` (PENDING, ACCEPTED, REVOKED, EXPIRED).
- Install bcryptjs; `prisma/seed.ts` bootstraps SUPER_ADMIN from `SUPER_ADMIN_EMAIL` + `SUPER_ADMIN_PASSWORD`.
- Super admin has no `Invitation.usedBy` row — created only via seed.
- Key files: `prisma/schema.prisma`, `lib/prisma.ts`, `prisma/seed.ts`, `.env.example`

</details>

---

## Activity: Admin Panel

### F2 · Admin Authentication · ✅ Completed

Multi-admin login via User table. Session carries `user.id` and `user.role` for access control across admin routes.

**Tasks**
- [x] Install next-auth v5 (Auth.js)
- [x] Configure Credentials provider with bcrypt password check
- [x] Extend session/JWT with `user.id` and `user.role`
- [x] Create admin login page
- [x] Add middleware protecting `/admin` routes (allow login + register)
- [x] Create admin layout with nav and logout
- [x] Add `AUTH_SECRET` to env
- [x] Test login, session persistence, role in session

<details>
<summary>Development Plan</summary>

- Auth.js v5 (next-auth) Credentials provider: verify email + password against `User.passwordHash` (bcrypt).
- JWT session callbacks attach `id`, `email`, `name`, `role` to `session.user`.
- `proxy.ts`: protect `/admin/*` except `/admin/login` and `/admin/register?token=...`
- Register route is public when valid invite token present (see F9).
- Key files:
  - `lib/auth.ts` — `authorize()`, session/jwt callbacks
  - `app/admin/login/page.tsx`
  - `app/admin/layout.tsx` — nav, logout, show role badge
- No env-only single admin — all admins are User rows (super admin seeded, others via invite).

</details>

---

### F9 · Admin Invites & User Management · ✅ Completed

Invite-only admin registration. Super admin creates invites, revokes pending ones, deletes other admins (not super admin). Regular admins see own profile only.

**Tasks**
- [x] Server Action: `createInvitation` (super admin only)
- [x] Server Action: `revokeInvitation` (super admin only)
- [x] Build `/admin/register` page — validate token, set password, create User
- [x] Wrap registration in Prisma transaction (User + Invitation ACCEPTED)
- [x] Optional: send invite email with link (Resend)
- [x] Build invitations list UI for super admin
- [x] Build users list + delete with `SUPER_ADMIN` guard
- [x] Build profile page for regular admins
- [x] Reject registration if email required on invite and mismatch

<details>
<summary>Development Plan</summary>

- Only `SUPER_ADMIN` can create/revoke invitations and delete users (enforced in Server Actions).
- Invite flow:
  - Generate token (nanoid), optional email lock, expiresAt
  - Share link: `/admin/register?token=[token]` OR send email (Resend)
  - Register: validate PENDING + not expired; create User (role ADMIN); transaction: mark Invitation ACCEPTED, usedById, usedAt
- Super admin cannot be deleted; DELETE user returns 403 if target.role === SUPER_ADMIN.
- Pages:
  - `app/admin/register/page.tsx` — public with token query
  - `app/admin/invitations` — list pending/revoked/accepted (super admin)
  - `app/admin/users` — list admins, delete non-super (super admin)
  - `app/admin/profile` — name/email/password with OTP for sensitive changes
- Key files: `lib/actions/invitations.ts`, `lib/actions/users.ts`, `lib/actions/profile.ts`

</details>

---

### F3 · Event & Participant Management · ✅ Completed

CRUD for events and participants. Events scoped by creator: admins see only their events; super admin sees all.

**Tasks**
- [x] Add `getEventsForSession()` helper with role-based filter
- [x] Create events list (scoped to creator unless super admin)
- [x] Build event creation form; set `createdById` on insert
- [x] Build event edit/detail with ownership check
- [x] Participant add/delete with event ownership check
- [x] Server Actions: `createEvent`, `updateEvent`, `deleteEvent`
- [x] Server Actions: `addParticipant`, `deleteParticipant`
- [x] Super admin: show Created by column on event list

<details>
<summary>Development Plan</summary>

- Visibility rule (every read/update/delete):
  - `SUPER_ADMIN` → no `createdById` filter
  - `ADMIN` → `WHERE createdById = session.user.id`
- `createEvent` sets `createdById = session.user.id` automatically.
- Attempt to access another admin's event → 404 or 403.
- Pages under `app/admin/events/`; Server Actions in `lib/actions/events.ts`, `lib/actions/participants.ts`.
- Event fields: name, description, slug (nanoid), isActive, startsAt, endsAt.
- Participant: name, optional imageUrl, displayOrder; cascade on event delete.
- `revalidatePath()` after mutations.

</details>

---

### F4 · Shareable Link & QR Code · ✅ Completed

Auto-generate unique voting and results URLs + QR codes per event. Admin can copy or download.

**Tasks**
- [x] Install nanoid; generate slug in `createEvent` Server Action
- [x] Install qrcode.react
- [x] Build `QRCodePanel` client component with canvas ref
- [x] Add Download QR as PNG functionality
- [x] Add Copy Link button with clipboard feedback
- [x] Show both vote + results QR codes on event detail page
- [x] Test QR codes scan correctly to the right pages

<details>
<summary>Development Plan</summary>

- Each Event has a slug field: generated with `nanoid(10)` on event creation.
  - Voting URL:  `https://[domain]/vote/[slug]`
  - Results URL: `https://[domain]/results/[slug]`
- Install `qrcode.react` and render `<QRCodeCanvas ref={...}>` for each URL.
- Download QR as PNG: `canvasRef.current.toDataURL('image/png')` → trigger `<a download>`.
- Copy link: `navigator.clipboard.writeText(url)` with visual 'Copied!' feedback (`useState` toggle).
- Show both QR codes side by side on the admin event detail page.
- Key files:
  - `components/QRCodePanel.tsx` — client component with copy + download
  - nanoid added to event creation Server Action

</details>

---

### F8 · Admin Dashboard & Controls · ✅ Completed

Home dashboard with role-scoped events. Super admin sees all events (with creator) plus links to user/invite management. Regular admin sees only own events.

**Tasks**
- [x] Create admin home page with role-scoped event fetch
- [x] Add Created by column for super admin only
- [x] Build events table with counts and actions
- [x] Implement `isActive` toggle with ownership check
- [x] Add copy-link buttons for vote and results URLs
- [x] Add delete event with confirmation + scope check
- [x] Build admin nav with super-admin-only links
- [x] Optional client-side search/filter on event list

<details>
<summary>Development Plan</summary>

- Dashboard: `app/admin/page.tsx`
- Event query uses same visibility as F3:
  - `SUPER_ADMIN` — all events, include `createdBy.name` in table
  - `ADMIN` — only events where `createdById = session.user.id`
- Columns: Name | Status | Participants | Votes | Created | [Created by] | Actions
- Actions: Edit, View Results, Copy vote/results links, Delete (ownership-checked).
- Nav links (role-gated):
  - Super admin: Users, Invitations, all events
  - All admins: My Events, Profile, Logout
- Toggle `isActive` via Server Action with ownership check.

</details>

---

## Activity: Voting Experience

### F5 · Public Voting Page · ✅ Completed

Voter-facing page: displays event participants as selectable cards, one vote per session.

**Tasks**
- [x] Create `/app/vote/[slug]/page.tsx` (Server Component)
- [x] Fetch event + participants server-side via Prisma
- [x] Build participant selection card grid (client component)
- [x] Implement single-select state with checkmark indicator
- [x] Create Submit Vote button with loading/disabled states
- [x] Handle event-not-found and event-ended guard states
- [x] Show 'Already Voted' screen on 409 response
- [x] Show success confirmation with results link on 201
- [x] Ensure fully mobile-responsive layout

<details>
<summary>Development Plan</summary>

- Page: `app/vote/[slug]/page.tsx`
- Server Component fetches event + participants. Guard states:
  - Event not found → 404 page
  - `isActive = false` → 'Voting has ended' message
- Client Component `<VotingUI>` handles selection state (single-select, radio semantics).
- On submit → `POST /api/votes` with `{ slug, participantId, fingerprint }`.
  - 409 response → show 'You have already voted' state
  - 201 response → show success screen with link to `/results/[slug]`
- Design: responsive card grid, large participant photos (or initials avatar), checkmark overlay on selected card, disabled state while submitting.

</details>

---

### F6 · Vote Uniqueness Enforcement · ✅ Completed

Prevent duplicate votes using device fingerprint + IP address — no sign-up required.

**Tasks**
- [x] Install `@fingerprintjs/fingerprintjs`
- [x] Load FingerprintJS and get `visitorId` on voting page
- [x] Build `POST /api/votes/route.ts` handler
- [x] Extract client IP from `x-forwarded-for` header
- [x] Hash `visitorId` + IP + `eventId` into composite `voterKey`
- [x] Query Vote table for duplicate before inserting
- [x] Return 409 on duplicate, 201 on successful insert
- [x] Store `voterKey` and `ipAddress` on Vote record
- [x] Test with multiple browsers/devices and incognito mode

<details>
<summary>Development Plan</summary>

- Install `@fingerprintjs/fingerprintjs` (free, client-side only, no server calls).
- On voting page load: load FingerprintJS, get `visitorId`, store in component state.
- Include `visitorId` in the `POST /api/votes` request body.
- Server-side in `app/api/votes/route.ts` (POST handler):
  1. Extract IP from `headers['x-forwarded-for']` or `request.ip`
  2. Build `voterKey = SHA-256(visitorId + ':' + ip + ':' + eventId)` via Node crypto
  3. Check: does Vote exist WHERE `eventId = ?` AND `voterKey = ?`
  4. Yes → return 409 `{ error: 'Already voted' }`
  5. No → INSERT Vote (`participantId`, `voterKey`, `ipAddress`, `fingerprint`); return 201
- DB safety net: `@@unique([eventId, voterKey])` rejects duplicates at database level.
- Fallback: if `visitorId` unavailable, fall back to IP-only `voterKey`.

</details>

---

## Activity: Results & Analytics

### F7 · Real-time Results Dashboard · ✅ Completed

Public results page with a live-updating bar chart showing participant rankings and vote counts.

**Tasks**
- [x] Create `/app/results/[slug]/page.tsx`
- [x] Install Recharts
- [x] Build `VoteBarChart` component (horizontal bars, sorted desc)
- [x] Create `lib/voteEmitter.ts` global EventEmitter singleton
- [x] Build SSE route `/api/results/[slug]/stream/route.ts`
- [x] Emit vote event from `/api/votes` after successful insert
- [x] Connect results page to SSE with EventSource
- [x] Re-sort and re-render chart on each SSE data push
- [x] Show total vote count + last updated timestamp
- [x] Handle empty state (no votes yet)

<details>
<summary>Development Plan</summary>

- Page: `app/results/[slug]/page.tsx`
- Initial render: Server Component fetches current vote counts (GROUP BY participantId).
- Install Recharts. Build `<VoteBarChart>` with horizontal BarChart:
  - Y-axis: participant names · X-axis: vote count
  - Sorted by votes descending in real-time
- Live updates via Server-Sent Events (SSE):
  - `lib/voteEmitter.ts` — global Node.js EventEmitter (singleton per server instance)
  - `app/api/results/[slug]/stream/route.ts` — streams `text/event-stream`
    Sets up ReadableStream, registers listener on voteEmitter, cleans up on disconnect.
  - `/api/votes` emits to voteEmitter after every successful insert
  - Client: `new EventSource('/api/results/[slug]/stream')` → parse JSON → update chart
- Show total vote count, last-updated indicator, and empty state message.

</details>

---

## Parallel Work Guide

| Phase | Features | Notes |
|-------|----------|-------|
| **Phase 1 — Sequential** | F1 | Full Prisma schema + super admin seed must be first |
| **Phase 2 — Auth chain** | F2 → F9 | Login + session (F2) before invites/register (F9) |
| **Phase 3 — Parallel** | F3, F4, F5, F6, F7, F8 | All can run simultaneously after F1–F2. F3 and F8 share `lib/events/access.ts` |

## Data Model

| Table | Role |
|-------|------|
| `User` | Admins only (`SUPER_ADMIN` \| `ADMIN`). Owns events; sends/uses invitations. |
| `Invitation` | Invite-only path to `ADMIN`. token unique; `usedById` unique (one user per invite). |
| `Event` | `createdById → User`. `slug` for public `/vote` and `/results` URLs. |
| `Participant` | Belongs to Event (cascade delete). Receives votes. |
| `Vote` | `voterKey` + `ipAddress` + `fingerprint`; `@@unique([eventId, voterKey])`. |

**Business rules**
- Only invite link can create `ADMIN` users; super admin seeded, not invitable.
- Super admin sees all events; admins see only events they created.
- Super admin can delete other admins; cannot delete another `SUPER_ADMIN`.
- One vote per `voterKey` per event (app check + DB unique constraint).

## Tech Stack

| Area | Choice |
|------|--------|
| Framework | Next.js 16 App Router + TypeScript |
| Styling | Tailwind CSS v4 |
| Database | PostgreSQL + Prisma 6 ORM |
| Authentication | Auth.js v5 — User table + bcrypt passwords |
| Admin onboarding | Invitation tokens + `/admin/register` |
| Email (optional) | Resend for invite links + OTP codes |
| Real-time | Server-Sent Events (SSE) |
| Charts | Recharts (horizontal bar chart) |
| QR Codes | qrcode.react |
| Fingerprinting | @fingerprintjs/fingerprintjs |
| Slug generation | nanoid |
