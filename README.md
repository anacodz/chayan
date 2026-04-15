# Chayan

AI-driven candidate screening platform for Cuemath. Replaces manual human-led screening calls with a high-fidelity, voice-first assessment flow.

[About Chayan (Project Doc)](https://docs.google.com/document/d/1dJwj0CnH_dNpeIUbuOqodggrha0CdS1OdftBl63gs_M/edit?usp=sharing)

## Overview

Chayan automates the first pass of tutor screening by evaluating:
- **Communication Clarity**: Can the tutor speak clearly and concisely?
- **Concept Explanation**: Can they simplify complex math concepts for kids?
- **Patience & Empathy**: Do they have the right temperament for teaching?
- **Professionalism**: Are they prepared and confident?

## End-to-End Flow

1.  **Recruiter Dashboard**: Recruiters create and send interview invitations to candidates.
2.  **Candidate Interview**: Candidates record voice responses to a sequence of teaching-focused questions.
3.  **Real-time Processing**: Audio is uploaded, transcribed (Sarvam AI / Whisper), and evaluated (Gemini 1.5) asynchronously.
4.  **Final Report**: AI synthesizes all answers into a structured assessment with a "Move Forward," "Hold," or "Decline" recommendation.
5.  **Review**: Recruiters review the transcripts, AI signals, and final reports to make hiring decisions.

## Tech Stack

| Layer | Choice |
| :--- | :--- |
| **Framework** | Next.js 15 (App Router) |
| **Database** | PostgreSQL + Prisma ORM |
| **Auth** | NextAuth.js (Credentials & Google) |
| **Async Jobs** | Inngest (Serverless Queues) |
| **AI (STT)** | Sarvam AI (Primary) / OpenAI Whisper (Fallback) |
| **AI (LLM)** | Google Gemini 1.5 Pro |
| **Storage** | Vercel Blob / AWS S3 Compatible |
| **Email** | Resend |
| **Styling** | Vanilla CSS + Tailwind (Utility) |

## Project Structure

```text
├── app/                  # Next.js App Router
│   ├── admin/            # Admin-only dashboards (metrics, calibration)
│   ├── api/              # API endpoints (Auth, Inngest, AI, Invites)
│   ├── components/       # UI components (Candidate & Recruiter)
│   ├── hooks/            # Custom React hooks (MediaRecorder, Session)
│   ├── interview/        # Candidate-facing interview flow
│   └── recruiter/        # Recruiter dashboard and session review
├── docs/                 # Detailed documentation (PRD, PDD, Roadmap)
├── lib/                  # Shared utilities and services
│   ├── services/         # Business logic (AI, Metrics, Calibration)
│   ├── prisma.ts         # Database client
│   └── auth.ts           # Auth configuration
└── prisma/               # Database schema and migrations
```

## Key Features

- **Resilient AI Pipeline**: Background processing with Inngest ensures interviews complete even if AI providers are slow or fail temporarily.
- **Metrics Dashboard**: Real-time tracking of invite conversion, completion rates, and AI alignment.
- **Calibration Engine**: Audit AI evaluation accuracy against human-graded samples.
- **Security**: Built-in assessment security (tab switching, focus loss detection) and authenticated recruiter access.

## Getting Started

1.  **Install dependencies**: `bun install` or `npm install`
2.  **Setup environment**: Copy `.env.example` to `.env` and fill in required keys (Gemini, Sarvam, Resend, DATABASE_URL).
3.  **Database**: `npx prisma generate && npx prisma db push`
4.  **Run locally**: `npm run dev`
5.  **Inngest Dev Server**: `npx inngest-cli@latest dev` (Required for local background jobs)

## License

Private - Cuemath Internal
