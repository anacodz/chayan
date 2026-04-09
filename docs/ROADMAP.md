# Chayan — Feature Roadmap

> This document maps PDD milestones to concrete implementation steps.
> Update this as decisions are finalized.

---

## Current State (Milestone 1 — Candidate Interview MVP)

✅ Next.js 15 App Router shell  
✅ Browser MediaRecorder API for audio capture  
✅ Upload fallback  
✅ Sarvam STT (primary) → OpenAI Whisper (fallback)  
✅ Per-answer evaluation via Gemini Flash (with local fallback)  
✅ Final report synthesis via Gemini Pro (with local fallback)  
✅ Candidate interview flow (welcome → record → process → report)  
✅ Premium dark UI with glassmorphism design system  

---

## Milestone 2 — STT and Evaluation Pipeline

### 2a: Audio Persistence

**Goal:** Store audio in object storage before transcription. Keep API keys server-side only.

**Steps:**
1. Choose object storage: **Vercel Blob** (simplest for Vercel deploy) or S3-compatible  
   - Decision pending: see PDD §24 open questions  
2. Add `OBJECT_STORAGE_*` env vars to `.env.example` ✅ (already done)  
3. Create `lib/storage.ts` — upload blob, return object key  
4. Update `/api/transcribe` to persist audio before calling STT providers  
5. Store object key with each answer record  

**Files to create/update:**
- `lib/storage.ts`
- `app/api/transcribe/route.ts`

---

### 2b: Schema Validation (Zod)

**Goal:** Validate AI JSON output strictly per PDD §11.

**Steps:**
1. `bun add zod`
2. Create `lib/schemas.ts` with Zod schemas for `AnswerEvaluation` and `FinalReport`
3. Replace `extractJsonObject` in `/api/evaluate` and `/api/summarize` with `schema.parse()`
4. On first parse failure: retry with a repair prompt (PDD E-003)
5. On second failure: return `requiresHumanReview: true`

**Files to create/update:**
- `lib/schemas.ts`
- `app/api/evaluate/route.ts`
- `app/api/summarize/route.ts`
- `lib/json.ts` → kept as fallback

---

### 2c: Transcript Quality Check

**Goal:** Detect silence / extremely short answers and request retry (PRD I-005).

**Steps:**
1. Check word count after transcription — less than 8 words → return `NEEDS_RETRY`
2. Show retry UI on the candidate screen
3. Log provider, latency, confidence when available

---

## Milestone 3 — Database + Session Persistence

**Goal:** Durable sessions, transcripts, evaluations, and audit trail.

### 3a: Choose and Set Up Database

**Decision needed:** Prisma vs. Drizzle (see PDD §24)
- **Recommendation: Prisma** — more mature, better migration tooling, easier onboarding

**Steps:**
1. `bun add prisma @prisma/client`
2. `bunx prisma init`
3. Define schema in `prisma/schema.prisma`:
   - `Candidate`, `InterviewSession`, `Question`, `Answer`, `Transcript`, `AnswerEvaluation`, `FinalReport`, `RecruiterDecision`
   - Match PDD §7 domain model exactly
4. `bunx prisma migrate dev --name init`
5. Create `lib/db.ts` — singleton Prisma client
6. Update API routes to persist to DB instead of returning stateless responses

**Files to create:**
- `prisma/schema.prisma`
- `lib/db.ts`

---

### 3b: Signed Invite Links (Auth — Candidate side)

**Goal:** Unique, expiring invite tokens for candidates. No account required (PRD C-001).

**Steps:**
1. Add `INVITE_TOKEN_SECRET` to env ✅ (already in `.env.example`)
2. `bun add jose` — JWT signing  
3. Create `lib/invite.ts`:
   - `createInviteToken(candidateId, sessionId, expiresAt)` → signed JWT
   - `validateInviteToken(token)` → session data or error
4. Create `/api/invites/[token]/route.ts` — validate token, return interview metadata
5. Add `InterviewSession.inviteTokenHash` and `inviteExpiresAt` to Prisma schema

**Key security rules (PDD §14):**
- Token is random, signed, hashed at rest
- Rate limit invite validation endpoint
- Token expires — show clear expiry UI (PDD failure table)

---

## Milestone 4 — Recruiter Dashboard + Auth

### 4a: Recruiter Authentication (SSO)

**Goal:** Secure recruiter and admin access. Candidates do NOT log in.

**Steps:**
1. `bun add next-auth@beta` (v5 for App Router)
2. Configure Google Workspace SSO or email magic link (decision: pending IDP choice — PDD §24)
3. Create `auth.ts` configuration
4. Add session middleware to protect `/recruiter/*` and `/admin/*` routes
5. Create `RBAC` utility: `recruiter`, `admin`, `system` roles

**Files to create:**
- `auth.ts`
- `middleware.ts`
- `app/recruiter/layout.tsx` (protected)
- `app/admin/layout.tsx` (protected)

---

### 4b: Recruiter Report Page

**Goal:** Recruiters can view the report, listen to audio, read transcripts, and record a decision (PRD H-001, H-002, H-003).

**Screens:**
- `/recruiter` — candidate list with filters (status, recommendation, date)
- `/recruiter/interviews/[sessionId]` — report detail
  - Recommendation badge + confidence indicator
  - Score cards with dimension breakdown
  - Per-question accordion: audio player, transcript, evaluation evidence
  - Decision form: Move Forward / Hold / Decline / Needs Review + notes

**Key requirements:**
- Show `requiresHumanReview` flag prominently (PRD R-003)
- Audio playback via signed URLs (PDD §9)
- Recruiter decision stored in `RecruiterDecision` table

---

## Milestone 5 — Background Jobs + Production Hardening

### 5a: Async Processing Queue

**Goal:** Decouple audio upload from STT + evaluation (PDD §19).

**Recommended provider:** **Inngest** (generous free tier, native Next.js support)

**Jobs to implement:**
| Job | Trigger |
|-----|---------|
| `transcribeAnswer` | Answer uploaded |
| `evaluateAnswer` | Transcription complete |
| `generateFollowUp` | Evaluation requests follow-up |
| `finalizeReport` | All answers evaluated |
| `expireInvites` | Cron — daily |
| `markAbandonedSessions` | Cron — hourly |
| `deleteExpiredAudio` | Cron — daily |

**Files to create:**
- `inngest.ts` — client setup
- `app/api/inngest/route.ts` — Inngest endpoint
- `lib/jobs/*.ts` — one file per job

---

### 5b: Admin Panel

**Goal:** Admin can manage question sets, view metrics, trigger deletion (PRD §13).

**Screens:**
- `/admin/questions` — view, create, edit question sets
- `/admin/metrics` — funnel rates, STT fallback %, eval failure %, latency p50/p95
- `/admin/deletion` — trigger candidate data deletion workflow

---

### 5c: Observability

**Goal:** Structured logs, metrics, alerting (PDD §16).

**Steps:**
1. Add `requestId` (nanoid) to all API responses
2. Structured JSON logging with `pino` or Vercel Log Drains
3. Track: invite open rate, completion rate, STT provider, latency, eval confidence
4. Alert thresholds: STT failure > 20%, eval failure > 5% (PRD §16 success metrics)

---

## Summary — Git Commit Plan per Milestone

```
# Milestone 2a
feat: add object storage for audio persistence

# Milestone 2b
feat: add Zod schema validation for AI evaluation output

# Milestone 2c
feat: add transcript quality check and retry flow

# Milestone 3a
feat: add Postgres database via Prisma and domain schema

# Milestone 3b
feat: add signed invite link generation and validation

# Milestone 4a
feat: add recruiter auth via SSO with NextAuth v5

# Milestone 4b
feat: add recruiter dashboard and report review UI

# Milestone 5a
feat: add Inngest background job queue for async processing

# Milestone 5b
feat: add admin panel for question sets and metrics

# Milestone 5c
chore: add structured logging and observability
```

> Each commit above maps to a single coherent feature slice per Git_Rules.md.
