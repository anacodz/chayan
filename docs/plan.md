## AI Tutor Screener

This project solves Cuemath Problem 3: an AI tutor screener that runs a short spoken interview, evaluates the candidate on teaching ability and communication, and generates a structured assessment report for recruiters.

## Goal

Build a simple web app where a reviewer can start an interview, answer a fixed set of tutor screening prompts by voice, and receive a concise, decision-ready evaluation with scores, strengths, risks, and a hiring recommendation.

## Day 1 scope

- Finalize the product shape and user flow
- Set up the repo with safe environment handling
- Build the first working slice of the experience
- Keep the architecture simple enough to ship in a few days

## Core features

1. Voice interview input
   - Record or upload short audio responses
   - Show the active question and recording state
2. AI processing pipeline
   - Transcribe the audio
   - Evaluate answers against a tutor rubric
   - Aggregate results into a final assessment
3. Structured output report
   - Overall recommendation
   - Rubric scores
   - Strengths
   - Concerns
   - Suggested next step
4. Basic error handling
   - Missing audio
   - Failed transcription
   - API timeout or malformed response

## Suggested tech stack

- Frontend: Next.js with React and TypeScript
- Styling: plain CSS modules or Tailwind if setup is fast
- Backend: Next.js route handlers for secure server-side API calls
- AI: Dual Model Gemini strategy (2.0 Flash for speed, 3.1 Pro for reasoning)
- STT: Sarvam AI for transcription; no TTS in the current build
- Storage: local browser state for v1; add persistence only if time remains
- Deployment: Vercel

## Design & UI Guidelines

**Theme:** Warm Professional
Not a generic SaaS dashboard. Not a cold clinical tool. Something that feels like a thoughtful company that works with kids and teachers.

### Color Palette
- **Background:** `#FAFAF8` (warm off-white, not stark white)
- **Primary accent:** `#FF6B35` (Cuemath's actual brand orange — use it for CTAs, active states, progress)
- **Secondary:** `#1A1A2E` (deep navy, for headings and important text)
- **Surface cards:** `#FFFFFF` with `box-shadow: 0 1px 4px rgba(0,0,0,0.08)` — subtle, not floating
- **Status:** Success `#22C55E` · Warning `#F59E0B` · Error `#EF4444`

### Typography
- **Font:** Inter (already in Tailwind/Next.js by default) — clean, readable at all sizes
- **Headings:** `font-semibold`, not bold — confident but not aggressive
- **Body:** `text-base` (16px), generous `leading-relaxed`

### Layout Policy
One thing per screen. The candidate should never be looking at more than one task at a time. No sidebars. No navbars during the interview. Remove all navigation chrome once the session starts — the candidate should feel like they're in a focused conversation, not using a dashboard.

| Screen | What's on it |
| --- | --- |
| **Welcome** | Logo, 3-line explainer, one "Begin Interview" button |
| **Question** | The question text, recording button, mic visualizer — nothing else |
| **Processing** | Single spinner/animation, short reassuring copy ("Reviewing your answer…") |
| **Report** | Structured card layout — recommendation at top, dimensions below |

### Component Policy (shadcn/ui rules)
1. **Use shadcn/ui for:** buttons, cards, badges, progress bar, toast notifications.
2. **Don't use shadcn for the recording button:** Build that custom. It's the hero interaction; it needs a pulsing ring animation when live, not a default button style.
3. **Border-radius consistency:** `rounded-xl` for cards, `rounded-full` for the record button.

### The "Hero" Interaction
Make the recording button feel alive. When the candidate is speaking, show:
- A pulsing red ring (CSS animation, not a gif)
- A real-time audio waveform via `wavesurfer.js`
This single detail signals *"this was designed for voice"* — which is exactly what the problem statement asks for. Everything else can be simple; this one element should feel polished.


## Core user flow

1. Recruiter opens the app and reads a short description of the screener.
2. Recruiter starts the interview session.
3. App shows one screening question at a time.
4. Candidate records an answer for each prompt.
5. App uploads audio to a server endpoint.
6. Server transcribes the response.
7. Server sends transcript plus rubric and question context to the AI evaluator.
8. App displays a final assessment report after all answers are processed.
9. Recruiter reviews recommendation and decides whether to move the tutor forward.

## AI API calls needed

1. Speech-to-text call
   - Input: recorded audio blob
   - Output: transcript text with enough accuracy for evaluation
2. Per-answer evaluation call
   - Input: question, transcript, tutor rubric
   - Output: score, reasoning, signals, red flags
3. Final summary call
   - Input: all answer evaluations
   - Output: overall recommendation, summary, and next-step note

## Evaluation rubric

- Communication clarity
- Concept explanation ability
- Empathy and student-friendliness
- Structured thinking
- Confidence and professionalism
- Spoken English quality

## Delivery priorities

1. End-to-end working demo over polish
2. Secure API key handling from the start
3. Clean, easy-to-understand output for judges
4. Nice UI only after the core flow works

## Risks and simplifications

- If live recording is slow to implement, support audio upload first and add recording next.
- If multi-step AI orchestration becomes unstable, combine evaluation into one server call.
- If persistence takes too long, keep sessions in memory for the demo.
