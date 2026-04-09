# Chayan PRD

## 1. Product Summary

Chayan is an AI-assisted voice screening product for Cuemath tutor candidates. It replaces an initial 10-minute human screening call with a structured browser-based voice interview, automated transcription, rubric-based evaluation, and a recruiter-facing assessment report.

The product is not a fully autonomous hiring system. Chayan provides a consistent first-pass recommendation and evidence pack so human recruiting teams can decide faster, review edge cases, and spend interview time on the highest-signal candidates.

## 2. Problem Statement

Cuemath evaluates large volumes of tutor candidates every month. Manual screening calls create operational bottlenecks:

- Recruiters spend time on repetitive first-round calls.
- Candidate quality signals are inconsistently captured across interviewers.
- Scheduling delays slow the hiring funnel.
- Screening cost grows linearly with candidate volume.
- Recruiters need comparable evidence for communication, teaching clarity, patience, and child-friendly temperament.

## 3. Goals

- Reduce first-round screening time per candidate from approximately 10 minutes of recruiter time to less than 2 minutes of review time.
- Let candidates complete the screen asynchronously in a browser without app installation.
- Capture 4-6 structured voice answers per candidate.
- Generate a reliable transcript for each answer, including support for Indian-accented English and code-mixed speech where possible.
- Score candidates against a consistent tutor-readiness rubric.
- Produce a recruiter report with recommendation, evidence, concerns, and transcript references.
- Keep all AI outputs explainable, auditable, and reviewable by humans.

## 4. Non-Goals

- Final hiring decision automation.
- Background verification, credential validation, or employment eligibility checks.
- Live video interviews.
- Full applicant tracking system replacement.
- Long-form pedagogical assessment beyond initial voice screening.
- Unbounded conversational interviewing.
- Candidate ranking across protected or sensitive attributes.

## 5. Target Users

### Candidate

A tutor applicant invited by Cuemath to complete an initial voice screen. The candidate needs a low-friction interview flow that works on common browsers, explains recording permissions clearly, and handles retries fairly.

### Recruiter

A Cuemath recruiter reviewing candidate reports. The recruiter needs fast signal, consistent scoring, evidence-backed recommendations, and clear flags for human follow-up.

### Hiring Operations Admin

An operations owner managing question sets, funnel performance, report quality, and compliance controls.

## 6. Key Use Cases

- Candidate opens an interview link, grants microphone permission, and completes the voice screen.
- Candidate retries a recording when there is a technical issue or silence.
- System transcribes audio and evaluates each answer against the rubric.
- System asks one targeted follow-up when an answer is incomplete or ambiguous.
- Recruiter opens a report and decides Move Forward, Hold, or Decline.
- Admin reviews aggregate performance, error rates, and evaluation calibration.

## 7. Product Scope

### MVP Scope

- Candidate interview web flow.
- Microphone permission and recording UI.
- 4-6 fixed screening questions.
- Server-side STT using Sarvam first and OpenAI Whisper fallback.
- Per-answer scoring using Gemini Flash-class model.
- Final assessment report using Gemini Pro-class model.
- Recruiter report page.
- Basic session persistence.
- Basic operational logging.

### Production Scope

- Durable interview, transcript, evaluation, report, and audit storage.
- Secure candidate invite links with expiry.
- Object storage for audio recordings with retention policies.
- Recruiter dashboard and candidate search.
- Manual override and reviewer notes.
- AI prompt/model version tracking.
- Monitoring, alerting, and quality dashboards.
- Privacy, consent, retention, and deletion workflows.
- Accessibility and browser compatibility hardening.

## 8. Candidate Experience Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| C-001 | Candidate can open a unique interview link without creating an account. | P0 |
| C-002 | Candidate sees interview purpose, estimated duration, recording notice, and consent language before recording. | P0 |
| C-003 | Candidate can run a microphone check before starting. | P0 |
| C-004 | Candidate can record an answer in the browser using the native MediaRecorder API. | P0 |
| C-005 | Candidate sees clear recording, uploading, processing, retry, and completion states. | P0 |
| C-006 | Candidate can replay and re-record before submitting when allowed by policy. | P1 |
| C-007 | Candidate receives a graceful fallback when microphone permission is denied. | P0 |
| C-008 | Candidate can resume an interrupted interview from the latest completed question while the invite is valid. | P1 |
| C-009 | Candidate sees no internal scores or hiring recommendation during the interview. | P0 |
| C-010 | Candidate receives confirmation after submission. | P0 |

## 9. Interview Flow Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| I-001 | Interview contains 4-6 structured questions selected from an approved question bank. | P0 |
| I-002 | Each question has expected competencies and scoring dimensions. | P0 |
| I-003 | System supports one targeted follow-up question when the candidate response is too short, unclear, or missing a key competency signal. | P1 |
| I-004 | Each recording has configurable max duration, default 90 seconds. | P0 |
| I-005 | System detects silence or near-empty audio and requests retry before evaluation. | P0 |
| I-006 | System prevents duplicate final submission from browser refresh or repeated clicks. | P0 |
| I-007 | System marks abandoned sessions after configurable inactivity timeout. | P1 |

## 10. Transcription Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| T-001 | Audio is uploaded to the backend before transcription. API keys are never exposed client-side. | P0 |
| T-002 | Primary STT provider is Sarvam for Indian-accented English and code-mixed speech. | P0 |
| T-003 | Fallback STT provider is OpenAI Whisper when primary STT fails or confidence is below threshold. | P0 |
| T-004 | Transcript stores provider, model, language, duration, confidence when available, and processing latency. | P0 |
| T-005 | Transcript can be manually corrected by an authorized reviewer. | P1 |
| T-006 | Original transcript and corrected transcript are both retained for auditability. | P1 |

## 11. Evaluation Requirements

Chayan evaluates tutor-readiness using a structured rubric. Each score must include evidence from the answer transcript and must avoid unsupported claims.

### Scoring Dimensions

| Dimension | Description | Score |
| --- | --- | --- |
| Communication Clarity | Clear, concise, understandable spoken explanation. | 1-5 |
| Concept Explanation | Ability to break down a concept simply and logically. | 1-5 |
| Empathy and Patience | Warmth, encouragement, and child-friendly temperament. | 1-5 |
| Adaptability | Ability to respond to confusion or adjust the explanation. | 1-5 |
| Professionalism | Reliability, seriousness, and appropriate tone. | 1-5 |
| English Fluency | Functional fluency for Cuemath tutoring context. | 1-5 |

### Per-Answer Evaluation

| ID | Requirement | Priority |
| --- | --- | --- |
| E-001 | Each answer receives dimension scores, confidence, evidence, concerns, and optional follow-up recommendation. | P0 |
| E-002 | AI response must be parsed from a strict JSON schema. | P0 |
| E-003 | Invalid AI JSON responses are retried once with a repair prompt and then marked for human review. | P0 |
| E-004 | Scores must be grounded in the transcript and cannot infer age, gender, religion, caste, disability, or other protected characteristics. | P0 |
| E-005 | Prompt version, model version, input transcript hash, and output schema version are stored with every evaluation. | P0 |

### Final Report

| ID | Requirement | Priority |
| --- | --- | --- |
| R-001 | Final report includes recommendation: Move Forward, Hold, or Decline. | P0 |
| R-002 | Final report includes score summary, strengths, risks, suggested recruiter follow-ups, and transcript evidence. | P0 |
| R-003 | Final report indicates low-confidence transcripts or evaluations. | P0 |
| R-004 | Recruiter can add notes and override the recommendation. | P1 |
| R-005 | Report export is available as a recruiter-readable page and optional PDF. | P2 |

## 12. Recruiter Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| H-001 | Recruiter can view candidate profile, interview status, final recommendation, and report. | P0 |
| H-002 | Recruiter can inspect per-question transcript, audio, and evaluation evidence. | P0 |
| H-003 | Recruiter can mark a decision: Move Forward, Hold, Decline, Needs Review. | P0 |
| H-004 | Recruiter can add private notes. | P1 |
| H-005 | Recruiter can filter candidates by status, recommendation, date, and error state. | P1 |
| H-006 | Recruiter can flag report quality issues for calibration. | P1 |

## 13. Admin Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| A-001 | Admin can manage approved question sets. | P1 |
| A-002 | Admin can configure recording duration, retry limit, invite expiry, and retention window. | P1 |
| A-003 | Admin can view funnel metrics, processing failures, average latency, and provider fallback rate. | P1 |
| A-004 | Admin can review model/prompt versions and calibration samples. | P1 |
| A-005 | Admin can trigger data deletion for eligible candidates. | P0 for production compliance |

## 14. Non-Functional Requirements

| Category | Requirement |
| --- | --- |
| Availability | Candidate interview flow target availability: 99.5% monthly after launch. |
| Latency | Upload acknowledgement under 3 seconds for typical audio on stable broadband. Per-answer transcript plus evaluation target p95 under 30 seconds. |
| Scalability | Support at least 500 interviews/day at launch, with a path to 5,000/day. |
| Security | API keys server-side only, encrypted storage, least-privilege access, signed invite links, rate limiting. |
| Privacy | Explicit recording consent, configurable audio retention, deletion workflow, no training on candidate data unless separately approved. |
| Accessibility | WCAG 2.1 AA target for candidate and recruiter UI. |
| Browser Support | Latest two major versions of Chrome, Edge, Safari, and Firefox on desktop; Chrome and Safari on mobile. |
| Observability | Logs, metrics, traces, alerting, and request correlation IDs for all processing steps. |
| Reliability | Idempotent submissions, retryable provider calls, dead-letter queue for failed processing. |
| Maintainability | Typed API contracts, schema validation, tests for critical flows, prompt version control. |

## 15. Compliance and Responsible AI

- Chayan must be positioned as decision support, not final hiring authority.
- Human reviewers must be able to inspect transcripts, audio, evidence, and model outputs.
- The system must not use sensitive attributes as evaluation inputs.
- Reports must avoid unsupported personality or mental-state claims.
- Low-confidence outputs must be routed to human review.
- Model prompts and rubrics must be periodically calibrated against human-reviewed samples.
- Data retention and candidate deletion processes must be approved by legal/compliance before production launch.
- Candidate consent copy must be reviewed before launch.

## 16. Success Metrics

| Metric | Target |
| --- | --- |
| Recruiter review time | Less than 2 minutes median per completed screen. |
| Interview completion rate | Greater than 80% of candidates who start recording. |
| Technical failure rate | Less than 5% of started interviews. |
| STT fallback rate | Tracked; investigate if greater than 20%. |
| Low-confidence report rate | Less than 15% after calibration. |
| Human agreement with recommendation | Greater than 80% on calibration set. |
| Candidate support tickets | Less than 3% of invited candidates. |

## 17. Analytics Events

- `invite_opened`
- `consent_accepted`
- `mic_permission_granted`
- `mic_permission_denied`
- `question_started`
- `recording_started`
- `recording_stopped`
- `answer_uploaded`
- `transcription_completed`
- `transcription_failed`
- `evaluation_completed`
- `evaluation_failed`
- `followup_requested`
- `interview_completed`
- `report_viewed`
- `recruiter_decision_saved`
- `report_flagged`

Each event should include session ID, tenant ID if applicable, timestamp, app version, browser metadata, and correlation ID. Candidate PII should not be added to analytics payloads unless explicitly required and approved.

## 18. Edge Cases

- Candidate denies microphone permission.
- Candidate starts on unsupported browser.
- Candidate has unstable network during upload.
- Candidate records silence, background noise, or very short answer.
- STT provider times out.
- AI provider returns malformed JSON.
- Candidate refreshes during upload or processing.
- Recruiter opens report before final processing completes.
- Candidate completes duplicate sessions from the same invite.
- Audio is uploaded but transcription fails permanently.
- Report confidence is too low for automated recommendation.

## 19. Launch Plan

### Phase 0: Internal Prototype

- Fixed questions.
- Manual invite links.
- Basic report page.
- No external candidates.

### Phase 1: Controlled Pilot

- 25-50 real candidates.
- Human recruiter reviews every report.
- Compare AI recommendation against recruiter decision.
- Track completion, latency, transcription quality, and support issues.

### Phase 2: Production Beta

- Recruiter dashboard.
- Persistent storage and audit logs.
- Admin-configurable question sets.
- Monitoring and alerting.
- Human review required for Hold, low-confidence, and failed-processing cases.

### Phase 3: General Production

- Standard operating process for recruiters.
- Calibration review cadence.
- Retention and deletion workflow.
- Performance dashboards.
- SLA and incident response ownership.

## 20. Acceptance Criteria

The product is ready for production beta when:

- A candidate can complete a full interview on supported browsers.
- Audio files are securely uploaded and retained according to policy.
- Transcripts are generated with provider fallback.
- Per-answer evaluations and final reports conform to strict schemas.
- Recruiters can view reports, evidence, transcripts, and audio.
- Low-confidence and failed-processing cases are clearly marked.
- Recruiters can record final decisions and notes.
- All P0 requirements pass QA.
- Critical flows have automated tests.
- API keys are not exposed in browser bundles.
- Monitoring and alerting cover upload, STT, AI evaluation, and report generation.
- Legal/compliance has approved consent, privacy, and retention copy.

## 21. Open Questions

- What is the approved candidate data retention window for audio and transcripts?
- Should candidates be able to see any output after completing the screen?
- What exact Cuemath hiring rubric thresholds define Move Forward, Hold, and Decline?
- Which ATS or recruiter workflow should receive final decisions?
- Is multilingual support required for launch or later?
- How many retries should be allowed per question?
- Should every Decline recommendation require human confirmation?
- What sample size is required for calibration before production rollout?
