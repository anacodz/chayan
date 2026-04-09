# Tech Stack

## Frontend

| What | Pick | Why |
| :--- | :--- | :--- |
| Framework | next@15 (App Router) | API routes = secure backend in one repo |
| Language | TypeScript | Catch bugs before the deadline does |
| Styling | Tailwind CSS v4 | Design system tokens, dark mode, responsive layout — PostCSS integration |
| Audio recording | MediaRecorder API (native browser) | No library needed; gives you a webm/ogg blob directly |
| Audio visualizer | Not included in v1 | Recording state is shown with clear controls; waveform can be added later |

## Voice — Candidate Speaks (STT)

| What | Pick | Why |
| :--- | :--- | :--- |
| Provider | Sarvam AI (saarika:v2) | Built specifically for Indian-accented English + Indian languages; handles complex accent mixes better than Whisper does out of the box |
| Fallback | openai Whisper (whisper-1) | For clearly neutral/global English; cheap at $0.006/min |
| Strategy | Try Sarvam first, fall back to Whisper on error | Best coverage without overcomplicating |
| Library | sarvamai SDK · openai npm SDK for Whisper | |

## AI — Evaluation + Orchestration

| AI Strategy | **Dual Model Compatibility** | High-performance + Low-latency balance |
| Fast Model | **gemini-2.0-flash** | Used for per-answer evaluation and follow-up generation (Low latency) |
| Power Model | **gemini-2.5-pro** | Used for the final Assessment Report and hiring recommendation (High reasoning) |
| Library | @google/genai | Official Google AI SDK for Node.js |
| Pattern | JSON route responses | Simple and reliable for the current linear demo flow |

## State & Session

| What | Pick | Why |
| :--- | :--- | :--- |
| Client state | React state (MVP) | Holds interview session (current Q, transcripts, scores) in memory for the demo |
| Database | Postgres via **Prisma** (Phase 2) | Durable session, transcript, evaluation, and audit storage — see ROADMAP.md |

## Deploy

| What | Pick |
| :--- | :--- |
| Platform | Vercel |
| Env vars | GEMINI_API_KEY, SARVAM_API_KEY, OPENAI_API_KEY — all server-side only |

---

## Deliberate Exclusions

| Framework | Why NOT |
| :--- | :--- |
| LangChain | Adds abstraction bloat for what is 2–3 direct Gemini API calls with structured prompts. No RAG, no chaining needed |
| LangGraph | Designed for complex multi-agent workflows with cycles and conditional branching. Chayan's flow is strictly linear: question → record → transcribe → evaluate → next → summarize |
| AutoGen | Multi-agent conversation framework (agents talking to agents). Chayan has one AI evaluating one human — not a multi-agent scenario |

> **Decision:** Direct `@google/genai` SDK calls. Each evaluation is a single prompt → JSON response. Simpler to build, debug, and ship within the deadline.

---

### The key call-out

**Sarvam `saarika:v2` is the right STT choice here**
