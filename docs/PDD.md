# Chayan PDD

## 1. Purpose

This Product Design Document defines the production architecture and implementation plan for Chayan, an AI-assisted voice screening system for Cuemath tutor candidates.

The current repo captures the intended stack and an STT proof of concept. This document expands that into a production design that supports durable sessions, secure audio handling, provider fallbacks, structured AI evaluation, recruiter review, auditability, and operational monitoring.

## 2. Design Principles

- Keep the candidate flow simple, linear, and resilient.
- Keep API keys and provider calls on the server.
- Treat AI output as structured data, not prose blobs.
- Store enough context to audit every recommendation.
- Prefer direct SDK calls over orchestration frameworks until the workflow becomes genuinely non-linear.
- Make failures visible and recoverable.
- Support human review for low-confidence, edge-case, or adverse recommendations.

## 3. Proposed Stack

| Layer | Choice |
| --- | --- |
| App framework | Next.js 15 App Router |
| Language | TypeScript |
| Styling | Plain CSS for current build; Tailwind/shadcn optional later |
| Recording | Browser MediaRecorder API |
| Audio visualizer | Not included in v1 |
| TTS | Not included in v1 |
| Primary STT | Sarvam speech-to-text |
| STT fallback | OpenAI Whisper |
| Evaluation | Google Gemini Flash-class model for per-answer evaluation |
| Final synthesis | Google Gemini Pro-class model for final report |
| Database | Postgres via Prisma or Drizzle |
| Object storage | S3-compatible bucket or Vercel Blob |
| Background jobs | Vercel Queue, Inngest, Trigger.dev, or managed queue |
| Auth | Signed candidate invite links; recruiter/admin SSO |
| Hosting | Vercel |
| Observability | Structured logs, metrics, traces, provider latency dashboards |

## 4. System Architecture

```text
Candidate Browser
  |
  | signed invite link, audio chunks, consent
  v
Next.js App + API Routes
  |
  | create session, upload audio, read report
  v
Application Services
  |-- Interview service
  |-- Audio service
  |-- Transcription service
  |-- Evaluation service
  |-- Report service
  |-- Notification service
  |
  | audio blobs
  v
Object Storage
  |
  | session data, transcripts, scores, audit
  v
Postgres
  |
  | async processing
  v
Job Queue
  |
  | provider calls
  v
Sarvam / OpenAI / Gemini

Recruiter Dashboard
  |
  v
Reports, audio playback, transcript evidence, decisions, notes
```

## 5. High-Level Flow

1. Recruiter or ATS creates an invite for a candidate.
2. Candidate opens signed invite link.
3. Candidate reviews consent and microphone instructions.
4. Candidate completes microphone check.
5. Candidate records answer for the current question.
6. Browser uploads audio to server.
7. Server stores audio in object storage and creates an answer record.
8. Background job transcribes audio with Sarvam.
9. If Sarvam fails or confidence is below threshold, system retries with Whisper.
10. Evaluation service scores the answer using the fast model and a strict JSON schema.
11. System either proceeds to the next question or asks one targeted follow-up.
12. After all required answers are complete, report service synthesizes the final report with the power model.
13. Recruiter reviews the report, evidence, and audio.
14. Recruiter records final decision and optional notes.

## 6. Session State Machine

```text
INVITED
  -> CONSENTED
  -> IN_PROGRESS
  -> ANSWER_UPLOADED
  -> TRANSCRIBING
  -> EVALUATING
  -> READY_FOR_NEXT_QUESTION
  -> FINALIZING
  -> COMPLETED

Any active state may transition to:
  -> NEEDS_CANDIDATE_RETRY
  -> NEEDS_HUMAN_REVIEW
  -> ABANDONED
  -> EXPIRED
```

State transitions must be idempotent. Repeated browser requests should not create duplicate final answers or duplicate reports. Answer records also keep their own processing status, but the session status should reflect the candidate- or recruiter-visible state.

## 7. Domain Model

### Candidate

```ts
type Candidate = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  source?: string;
  createdAt: string;
};
```

### InterviewSession

```ts
type InterviewSession = {
  id: string;
  candidateId: string;
  status:
    | "INVITED"
    | "CONSENTED"
    | "IN_PROGRESS"
    | "ANSWER_UPLOADED"
    | "TRANSCRIBING"
    | "EVALUATING"
    | "READY_FOR_NEXT_QUESTION"
    | "FINALIZING"
    | "COMPLETED"
    | "NEEDS_CANDIDATE_RETRY"
    | "NEEDS_HUMAN_REVIEW"
    | "ABANDONED"
    | "EXPIRED";
  questionSetId: string;
  inviteTokenHash: string;
  inviteExpiresAt: string;
  consentAcceptedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
};
```

### Question

```ts
type Question = {
  id: string;
  questionSetId: string;
  prompt: string;
  competencyTags: string[];
  maxDurationSeconds: number;
  order: number;
  active: boolean;
};
```

### Answer

```ts
type Answer = {
  id: string;
  sessionId: string;
  questionId: string;
  attemptNumber: number;
  audioObjectKey: string;
  audioDurationSeconds?: number;
  status:
    | "UPLOADED"
    | "TRANSCRIBED"
    | "EVALUATED"
    | "FAILED"
    | "NEEDS_RETRY";
  createdAt: string;
};
```

### Transcript

```ts
type Transcript = {
  id: string;
  answerId: string;
  provider: "sarvam" | "openai";
  model: string;
  text: string;
  correctedText?: string;
  language?: string;
  confidence?: number;
  latencyMs: number;
  createdAt: string;
};
```

### AnswerEvaluation

```ts
type AnswerEvaluation = {
  id: string;
  answerId: string;
  modelProvider: "google";
  model: string;
  promptVersion: string;
  schemaVersion: string;
  transcriptHash: string;
  scores: {
    communicationClarity: number;
    conceptExplanation: number;
    empathyAndPatience: number;
    adaptability: number;
    professionalism: number;
    englishFluency: number;
  };
  confidence: number;
  evidence: string[];
  concerns: string[];
  followUpQuestion?: string;
  requiresHumanReview: boolean;
  rawModelOutputObjectKey?: string;
  createdAt: string;
};
```

### FinalReport

```ts
type FinalReport = {
  id: string;
  sessionId: string;
  recommendation: "MOVE_FORWARD" | "HOLD" | "DECLINE";
  overallScore: number;
  confidence: number;
  strengths: string[];
  risks: string[];
  suggestedFollowUps: string[];
  evidenceByQuestion: Array<{
    questionId: string;
    transcriptExcerpt: string;
    rationale: string;
  }>;
  model: string;
  promptVersion: string;
  schemaVersion: string;
  requiresHumanReview: boolean;
  createdAt: string;
};
```

### RecruiterDecision

```ts
type RecruiterDecision = {
  id: string;
  sessionId: string;
  reviewerId: string;
  decision: "MOVE_FORWARD" | "HOLD" | "DECLINE" | "NEEDS_REVIEW";
  notes?: string;
  createdAt: string;
};
```

## 8. API Design

All API responses should include `requestId`. All mutations should support idempotency keys where duplicate submissions are possible.

### Candidate APIs

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/invites/:token` | Validate invite and return interview metadata. |
| `POST` | `/api/interviews/:sessionId/consent` | Record candidate consent. |
| `GET` | `/api/interviews/:sessionId/current` | Return current question and progress. |
| `POST` | `/api/interviews/:sessionId/answers` | Create answer upload intent. |
| `PUT` | `/api/interviews/:sessionId/answers/:answerId/audio` | Upload audio blob or complete direct upload. |
| `POST` | `/api/interviews/:sessionId/answers/:answerId/submit` | Queue transcription and evaluation. |
| `POST` | `/api/interviews/:sessionId/complete` | Mark candidate side complete and queue final report. |

### Recruiter APIs

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/recruiter/interviews` | List and filter sessions. |
| `GET` | `/api/recruiter/interviews/:sessionId` | Get report, transcripts, evidence, and status. |
| `POST` | `/api/recruiter/interviews/:sessionId/decision` | Save recruiter decision. |
| `POST` | `/api/recruiter/interviews/:sessionId/notes` | Save reviewer notes. |
| `POST` | `/api/recruiter/interviews/:sessionId/flag` | Flag report quality issue. |

### Admin APIs

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/admin/question-sets` | List question sets. |
| `POST` | `/api/admin/question-sets` | Create question set. |
| `PATCH` | `/api/admin/question-sets/:id` | Update question set. |
| `POST` | `/api/admin/data-deletion` | Start approved deletion workflow. |
| `GET` | `/api/admin/metrics` | View operational metrics. |

## 9. Audio Handling

- Browser records with MediaRecorder using the best supported format, typically `audio/webm`.
- Client should cap recording duration and display a countdown.
- Server validates file type, duration, size, and session ownership.
- Audio files are stored using object keys that do not contain candidate PII.
- Signed URLs are used for recruiter playback.
- Audio retention is configurable. Default proposal: retain audio for 90 days, transcripts and final decisions for the approved hiring audit window.
- Deletion jobs must remove object storage files and database references according to policy.

## 10. STT Provider Strategy

Primary flow:

1. Submit audio to Sarvam.
2. Store transcript, model, latency, language, and confidence when available.
3. If request fails, times out, or quality threshold is not met, retry once.
4. If still unsuccessful, submit to Whisper fallback.
5. If fallback fails, mark answer `NEEDS_HUMAN_REVIEW`.

Recommended thresholds should be tuned in pilot:

- Empty transcript: fail.
- Transcript shorter than minimum word count for a non-silence answer: retry candidate or human review.
- Provider latency above SLA: record metric but do not fail if output is valid.

## 11. Evaluation Design

### Per-Answer Prompt Contract

Inputs:

- Question prompt.
- Competency tags.
- Transcript text.
- Retry/follow-up count.
- Rubric definitions.
- Output JSON schema.

Outputs:

- Dimension scores from 1 to 5.
- Overall answer confidence from 0 to 1.
- Evidence excerpts.
- Concerns.
- Follow-up question or null.
- Human review flag.

Rules:

- Use only transcript evidence.
- Do not infer sensitive attributes.
- Do not make final hiring recommendation at per-answer stage.
- Return JSON only.
- If transcript is insufficient, mark low confidence.

### Final Report Prompt Contract

Inputs:

- All questions.
- All transcripts.
- All per-answer evaluations.
- Rubric thresholds.
- Known low-confidence flags.
- Output JSON schema.

Outputs:

- Recommendation.
- Overall score.
- Confidence.
- Strengths.
- Risks.
- Evidence by question.
- Suggested recruiter follow-ups.
- Human review flag.

### JSON Validation

- Use Zod or equivalent runtime schema validation.
- Store raw invalid provider output in restricted object storage for debugging.
- Retry once with a repair prompt.
- If repair fails, mark `NEEDS_HUMAN_REVIEW`.

## 12. Recommendation Logic

The final recommendation should combine deterministic thresholding with model synthesis.

Proposed baseline:

- `MOVE_FORWARD`: overall score >= 4.0, no critical risks, confidence >= 0.75.
- `HOLD`: overall score >= 3.0 or confidence between 0.5 and 0.75, or mixed evidence.
- `DECLINE`: overall score < 3.0 with sufficient confidence and evidence.
- `NEEDS_HUMAN_REVIEW`: low transcript confidence, malformed evaluations, policy flags, or inconsistent evidence.

Adverse recommendations should be reviewed by a recruiter during beta.

## 13. Frontend Design

### Candidate UI

Core screens:

- Invite validation and welcome.
- Consent and recording notice.
- Microphone test.
- Question screen with recording controls.
- Upload and processing state.
- Retry state.
- Completion confirmation.

Important UI behavior:

- Never show internal scores to candidates.
- Keep progress visible.
- Keep recording state unmistakable.
- Show plain recovery instructions for permission and network errors.
- Use stable layout dimensions for recorder controls and timers.

### Recruiter UI

Core screens:

- Candidate/interview list.
- Report detail.
- Per-question transcript and audio playback.
- Evidence and scoring section.
- Decision and notes form.
- Quality flag action.

### Admin UI

Core screens:

- Question set manager.
- Operational metrics.
- Prompt/model version history.
- Data deletion workflow.

## 14. Security Design

- Candidate invite token is random, signed, hashed at rest, and expires.
- Recruiter and admin access require SSO or equivalent identity provider.
- Role-based access controls distinguish recruiter, admin, and system service permissions.
- Provider API keys are stored as server-side environment variables only.
- Audio playback uses short-lived signed URLs.
- Rate limit invite validation, upload, STT, and evaluation routes.
- Validate MIME type, file size, and duration before processing audio.
- Do not log raw transcripts, candidate PII, API keys, or full model prompts in normal application logs.
- Maintain audit events for report view, decision save, manual transcript correction, data export, and deletion.

## 15. Privacy and Data Retention

Data categories:

- Candidate PII: name, email, phone.
- Interview data: questions, answers, transcripts, scores, report.
- Audio data: candidate voice recordings.
- Operational data: logs, metrics, provider latency, error codes.

Controls:

- Consent required before recording.
- Retention windows configurable by data category.
- Audio retention should be shorter than transcript/report retention unless policy requires otherwise.
- Candidate deletion workflow should delete or anonymize dependent records.
- Access to audio and transcripts should be limited to authorized hiring users.
- Provider data processing terms must be reviewed before production launch.

## 16. Observability

### Logs

- Use structured JSON logs.
- Include request ID, session ID, answer ID, provider, status, latency, and error code.
- Redact PII and transcript content by default.

### Metrics

- Invite open rate.
- Consent acceptance rate.
- Interview start and completion rate.
- Audio upload failures.
- STT success, fallback, and failure rates.
- STT p50/p95 latency by provider.
- Evaluation success and invalid JSON rates.
- Final report generation p50/p95 latency.
- Human review rate.
- Recruiter override rate.

### Alerts

- STT failure rate above threshold.
- Evaluation failure rate above threshold.
- Report generation backlog above threshold.
- Audio upload errors above threshold.
- Provider latency degradation.
- Unhandled server errors.

## 17. Testing Strategy

### Unit Tests

- Rubric thresholding.
- Session state transitions.
- Invite token validation.
- Schema parsing for STT and evaluation outputs.
- Recommendation logic.

### Integration Tests

- Candidate full interview flow with mocked providers.
- STT primary failure and fallback path.
- Invalid AI JSON repair path.
- Report generation path.
- Recruiter decision save.

### E2E Tests

- Candidate completes an interview.
- Candidate retries after microphone or upload error.
- Recruiter reviews report and records decision.
- Admin updates a question set.

### Manual QA

- Browser microphone permission behavior across supported browsers.
- Mobile Safari recording.
- Background noise and silence handling.
- Slow network upload.
- Accessibility keyboard navigation and screen reader pass.

## 18. Failure Handling

| Failure | Handling |
| --- | --- |
| Invite expired | Show clear expiry message and recruiter contact path. |
| Microphone denied | Explain browser permission steps and allow retry. |
| Unsupported browser | Show supported browser guidance. |
| Upload fails | Retry with exponential backoff and allow candidate retry. |
| STT fails | Retry primary provider, then fallback provider, then human review. |
| AI evaluation fails | Retry, repair JSON, then human review. |
| Final report fails | Keep session complete and retry report generation in background. |
| Recruiter opens incomplete report | Show processing status and partial evidence. |

## 19. Background Jobs

Recommended jobs:

- `transcribeAnswer(answerId)`
- `evaluateAnswer(answerId)`
- `generateFollowUp(sessionId, answerId)`
- `finalizeReport(sessionId)`
- `expireInvites()`
- `markAbandonedSessions()`
- `deleteExpiredAudio()`
- `syncRecruiterDecision(sessionId)`

Jobs should be idempotent and safe to retry. Failed jobs should include error classification and move to a dead-letter queue after max attempts.

## 20. Configuration

Environment variables:

```text
GEMINI_API_KEY=
SARVAM_API_KEY=
OPENAI_API_KEY=
DATABASE_URL=
OBJECT_STORAGE_BUCKET=
OBJECT_STORAGE_REGION=
OBJECT_STORAGE_ACCESS_KEY_ID=
OBJECT_STORAGE_SECRET_ACCESS_KEY=
INVITE_TOKEN_SECRET=
APP_BASE_URL=
```

Runtime configuration:

- Invite expiry duration.
- Recording max duration.
- Retry limit per question.
- Required question count.
- STT timeout.
- Evaluation timeout.
- Audio retention days.
- Low-confidence threshold.
- Recommendation thresholds.

## 21. Implementation Milestones

### Milestone 1: Candidate Interview MVP

- Next.js app shell.
- Signed invite validation.
- Consent screen.
- Microphone test.
- Recording and upload flow.
- Fixed question set.

### Milestone 2: STT and Evaluation Pipeline

- Audio persistence.
- Sarvam transcription.
- Whisper fallback.
- Per-answer evaluation.
- Strict schema validation.
- Basic failure states.

### Milestone 3: Final Report and Recruiter Review

- Final report generation.
- Recruiter report page.
- Audio playback.
- Decision and notes.
- Human review flags.

### Milestone 4: Production Hardening

- Database migrations.
- Object storage retention.
- Background jobs.
- Monitoring and alerting.
- Admin question management.
- Security review.
- Accessibility and browser QA.

## 22. Key Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| STT struggles with accents or noisy audio | Sarvam primary, Whisper fallback, confidence flags, human review. |
| AI recommendation is biased or unsupported | Strict rubric, evidence requirements, sensitive-attribute restrictions, calibration review. |
| Candidate data exposure | Signed URLs, RBAC, redacted logs, encryption, retention controls. |
| Provider outage | Retry, fallback where available, queue jobs, visible degraded status. |
| Candidate abandons due to UX friction | Mic test, clear progress, short questions, retry guidance. |
| Recruiters distrust AI reports | Evidence-first reports, audio/transcript access, override flow, agreement metrics. |

## 23. Decisions

| Decision | Rationale |
| --- | --- |
| Use direct provider SDK/API calls instead of LangChain or agent frameworks. | Workflow is linear and easier to debug with explicit services. |
| Use Sarvam as primary STT. | Product context requires strong support for Indian-accented English and possible code-mixing. |
| Use a dual-model evaluation strategy. | Fast per-answer feedback stays responsive; final synthesis can use a stronger reasoning model. |
| Store prompt and model versions with outputs. | Required for auditability, calibration, and regression analysis. |
| Require human review for low-confidence cases. | Reduces risk in a hiring workflow. |

## 24. Open Technical Questions

- Which persistence layer should the repo standardize on: Prisma or Drizzle?
- Which queue provider best fits the deployment constraints?
- Should audio upload use API route streaming or direct-to-object-storage signed uploads?
- What is the approved retention policy by data type?
- Which identity provider will recruiters and admins use?
- Should final reports sync to an ATS, and if yes, which one?
- What exact model versions are approved and available at implementation time?
- What calibration dataset will be used before production beta?
