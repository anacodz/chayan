# Chayan - Product & Technical Direction

## 1. Product Vision
**Problem:** Cuemath evaluates large volumes of tutor candidates monthly. Human-led 10-minute screening calls are expensive, slow, hard to scale consistently, and create bottlenecks in the hiring funnel.
**Target Users:** Tutor Candidates (need a low-friction interview flow) and Cuemath Recruiters (need fast, consistent, and evidence-backed signals).
**Solution:** Chayan is an AI-assisted voice screening platform that automates the first-pass interview. It records candidate answers via a simple browser flow, transcribes the audio, evaluates responses against a tutor-focused rubric, and generates a structured assessment report.
**Core Value:** Reduce first-round screening time per candidate from ~10 minutes to <2 minutes of recruiter review time, while providing consistent and auditable evidence for communication clarity, empathy, and teaching skills.

## 2. Current State Audit
- **Phase:** MVP / Proof of Concept.
- **App Stack:** Next.js 15 App Router, TypeScript, Plain CSS (with Tailwind CSS v4 planned).
- **Audio:** Browser `MediaRecorder` API. Client-side React state currently holds the interview session in memory.
- **AI Integration:** 
  - API routes established for `/api/transcribe`, `/api/evaluate`, and `/api/summarize`.
  - Direct `@google/genai` SDK calls are used instead of heavy orchestration frameworks (like LangChain) to keep the system simple and linear.
- **Missing Production Capabilities:**
  - Durable persistence (Database for sessions, Object Storage for audio).
  - Background job processing (to handle transcription and evaluation without blocking the client or timing out).
  - Secure authentication (signed invite links for candidates, SSO for recruiters).
  - Recruiter dashboard for reviewing reports and audio playback.

## 3. Technical Direction & Key Decisions

To ensure the product scales while maintaining simplicity and alignment with the product vision, the following technical directions are enforced:

### Architecture Philosophy
- **Simplicity First:** Maintain a linear, stateless-where-possible architecture. Avoid complex agentic frameworks; the flow is strictly linear (question -> record -> transcribe -> evaluate -> next -> summarize).
- **Resilience:** Treat AI output as structured data (JSON schemas). Make failures visible and recoverable via retries or graceful fallbacks. 
- **Auditability:** Retain transcripts, prompts, and audio to ensure human reviewers can verify any AI-generated claim or low-confidence score.

### Tech Stack Decisions
- **Framework:** Next.js 15 App Router. Unifies the frontend UI and backend API routes in a single repository for rapid iteration.
- **Database (Upcoming):** Postgres via Prisma. Chosen for strong typing and ease of modeling the relational state machine (Candidates, Sessions, Answers, Evaluations).
- **Audio Storage (Upcoming):** S3-compatible storage or Vercel Blob. Essential for decoupling large media files from API route memory and allowing background processing.
- **Async Jobs (Upcoming):** Introduce a queue (e.g., Inngest or Vercel Queue) to handle transcription and LLM evaluation asynchronously. This will prevent Vercel serverless function timeouts.

### AI Strategy
- **STT (Speech-to-Text):** 
  - **Primary:** Sarvam AI (`saarika:v2`). Specifically chosen to handle Indian-accented English and code-mixed speech.
  - **Fallback:** OpenAI Whisper. Reliable and cost-effective fallback for standard English or if Sarvam experiences downtime.
- **Evaluation (LLMs):**
  - **Fast Model:** `gemini-2.0-flash` for per-answer evaluation and rapid JSON schema extraction. Keeps the interview loop responsive.
  - **Power Model:** `gemini-2.5-pro` for final assessment synthesis. Optimizes for high-quality reasoning when generating the final report and hiring recommendation.

## Execution Rules
- All new features must directly support the core user journey defined in the Product Vision.
- Do not introduce new dependencies unless they provide significant value over native APIs.
- Ensure that the application gracefully degrades (e.g., when microphone access is denied or STT fails).
- The Recruiter Dashboard must prioritize evidence (transcript excerpts, audio playback) over black-box AI scores.
