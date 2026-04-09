# Chayan — AI Tutor Screener

> **चयन** *(chayan)* — Sanskrit/Hindi for **"selection"**. The art of choosing the right person.

Chayan is an AI-powered voice screening platform that helps Cuemath evaluate tutor candidates at scale — replacing slow, expensive 10-minute human screening calls with an intelligent, voice-first interview pipeline.

---

## Problem

Cuemath hires hundreds of tutors every month. Every candidate goes through a screening call to evaluate:
- Can they communicate clearly?
- Are they patient and child-friendly?
- Can they explain concepts simply?
- Do they have the right temperament for kids?

Manual calls are slow, expensive, and produce inconsistent quality signals. **Chayan automates the first-pass screen.**

---

## What it does

1. Candidate opens a unique interview link and completes a **microphone check**
2. Candidate records answers to 4–6 structured questions in the **browser** (no app install)
3. Audio is **transcribed** server-side — Sarvam AI (primary, Indian-accented English) → OpenAI Whisper (fallback)
4. A **dual-model AI pipeline** evaluates each answer against a structured rubric:
   - **Fast model (Gemini 2.0 Flash):** Per-answer scoring across 6 dimensions, evidence, and follow-up generation
   - **Power model (Gemini 2.5 Pro):** Final synthesis — recommendation, strengths, risks, recruiter follow-ups
5. Recruiter reviews the **structured assessment report**: Move Forward / Hold / Decline

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Plain CSS |
| Recording | Browser MediaRecorder API |
| Audio visualizer | Not included in v1 |
| TTS | Not included in the current build |
| STT (primary) | Sarvam AI `saarika:v2` |
| STT (fallback) | OpenAI Whisper `whisper-1` |
| AI evaluation | Google Gemini (Flash + Pro) |
| Deploy | Vercel |

---

## Running Locally

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in at minimum: GEMINI_API_KEY
# Add SARVAM_API_KEY or OPENAI_API_KEY to enable real transcription

# Run dev server
npm run dev
```

### Required Environment Variables

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Optional Google Gemini API key for AI evaluation. Local rubric fallback is used when missing. |
| `SARVAM_API_KEY` | Sarvam AI key for Indian-accented STT. Configure this or `OPENAI_API_KEY`. |
| `OPENAI_API_KEY` | OpenAI Whisper key for STT fallback. Configure this or `SARVAM_API_KEY`. |

> Without API keys, the app runs with a local rubric-based fallback evaluator for development.

---

## Project Structure

```
app/
  api/
    transcribe/     # STT — Sarvam primary, Whisper fallback
    evaluate/       # Per-answer scoring via Gemini Flash
    summarize/      # Final report via Gemini Pro
  layout.tsx
  page.tsx          # Candidate interview flow
  styles.css
lib/
  types.ts          # Domain model types
  questions.ts      # Screening question bank
  evaluation.ts     # Local fallback evaluator
  json.ts           # Safe JSON extraction from model output
docs/
  PRD.md            # Product requirements
  PDD.md            # Technical design
  stack.md          # Stack decisions and rationale
  TODO.md          # Challenge checklist
```

---

## Cuemath Build Challenge — Problem #3
