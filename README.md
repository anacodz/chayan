# Chayan — AI Tutor Screener

> **चयन** *(chayan)* — Sanskrit/Hindi for **"selection"**. The art of choosing the right person.

Chayan is an AI-powered voice screener that helps Cuemath evaluate tutor candidates at scale — replacing slow, expensive 10-minute human calls with an intelligent, voice-first interview pipeline.

---

## Problem

Cuemath hires hundreds of tutors every month. Every candidate goes through a screening call to evaluate:
- Can they communicate clearly?
- Are they patient?
- Can they explain concepts simply?
- Do they have the right temperament for kids?

Manual calls are slow, expensive, and hard to scale. **Chayan automates this.**

---

## What it does

1. Candidate answers 4–6 structured questions via **voice recording** in the browser
2. Audio is **transcribed** server-side (Whisper / Deepgram)
3. An **AI evaluation pipeline** (Anthropic Claude) scores each answer across rubric dimensions: clarity, explanation ability, empathy, structure, confidence, fluency
4. Generates an **Assessment Report** with a final recommendation: Move Forward / Hold / Decline

---

## Tech Stack

- **Frontend:** Next.js + TypeScript + Tailwind CSS
- **Voice:** Browser `MediaRecorder` API → server-side transcription
- **AI:** Anthropic Claude API (evaluation + summarization)
- **STT:** OpenAI Whisper / Deepgram
- **Deploy:** Vercel

---

## Running Locally

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your ANTHROPIC_API_KEY and STT API key to .env.local

# Run dev server
npm run dev
```

### Required Environment Variables

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Claude API key for AI evaluation |
| `STT_API_KEY` | Deepgram or OpenAI Whisper API key |

---

## Cuemath Build Challenge — Problem #3
