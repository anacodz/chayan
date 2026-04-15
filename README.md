# Chayan

[About Chayan](https://docs.google.com/document/d/1dJwj0CnH_dNpeIUbuOqodggrha0CdS1OdftBl63gs_M/edit?usp=sharing)

Chayan is an AI tutor screening platform for Cuemath. It replaces slow manual screening calls with a voice-first interview flow that records candidate answers, transcribes them, and generates a structured assessment report.

## Problem

Cuemath screens a large number of tutor candidates every month. Human-led 10-minute screening calls are expensive, slow, and hard to scale consistently.

Chayan automates the first pass by checking whether a tutor can:

- communicate clearly
- explain simply
- show patience and empathy
- demonstrate the right temperament for teaching kids

## What It Does

1. Candidate opens an interview link
2. Candidate completes a microphone check and records answers in the browser
3. Audio is transcribed server-side with Sarvam AI
4. Gemini evaluates each answer using a tutor-focused rubric
5. The app generates a structured final recommendation for recruiters

## Tech Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 15 |
| Language | TypeScript |
| Styling | Plain CSS |
| Recording | Browser MediaRecorder API |
| Transcription | Sarvam AI |
| Evaluation | Google Gemini |
| Deployment | Vercel |

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Add these environment variables to `.env.local` as needed:

- `SARVAM_API_KEY`
- `GEMINI_API_KEY`

The app can still run in a local fallback mode when AI keys are missing.

## Project Structure

```text
app/
  api/
    transcribe/
    evaluate/
    summarize/
  layout.tsx
  page.tsx
  styles.css
lib/
  evaluation.ts
  json.ts
  questions.ts
  types.ts
docs/
  PRD.md
  PDD.md
  stack.md
  TODO.md
```

## Challenge Context

Built for the Cuemath Build Challenge, Problem 3: AI Tutor Screener.
