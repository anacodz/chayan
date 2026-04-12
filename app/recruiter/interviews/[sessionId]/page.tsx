"use client";

import Link from "next/link";
import { useState } from "react";

/* ── Static demo data (replaced by DB query in Phase 2) ─────── */
const CANDIDATE = {
  name: "Aaliya Sharma",
  initials: "AS",
  role: "Primary School Educator",
  email: "aaliya.sharma@example.com",
  phone: "+91 98765 43210",
  screenedOn: "12 Apr 2026",
  duration: "12m 38s",
  matchScore: 88,
  confidence: 94,
  recommendation: "Move Forward" as const,
};

const DIMENSION_SCORES = [
  { label: "Communication",       score: 9.2 },
  { label: "Concept Explanation", score: 8.8 },
  { label: "Empathy & Patience",  score: 9.1 },
  { label: "Adaptability",        score: 8.4 },
  { label: "Professionalism",     score: 8.7 },
  { label: "English Fluency",     score: 8.5 },
];

const STRENGTHS = [
  { title: "Strong Pedagogy",       body: "Demonstrated inquiry-based learning approach; uses real-world examples to anchor abstract concepts." },
  { title: "Child-Friendly Tone",   body: "Warm, patient delivery suited for young learners. Naturally adjusts language complexity to the student." },
  { title: "Conceptual Clarity",    body: "Explains fractions and ratios with consistent analogies — scored 40% above cohort average on concept explanation." },
];

const RISKS = [
  { title: "Pacing",               body: "Occasionally over-explains, which could slow lesson flow. May need guidance on time management within a session." },
  { title: "Tool Familiarity",      body: "Limited exposure to digital whiteboard tools. Likely requires one week of onboarding." },
];

const QUESTIONS = [
  {
    id: "q1",
    label: "Question 1 · Concept Explanation",
    question: "Explain fractions to a 9-year-old who is seeing them for the first time.",
    focus: "Pedagogy Focus",
    score: 95,
    transcript: `"Think of a chocolate bar with 8 equal pieces. If you eat 3 pieces, you've eaten 3 out of 8 — or three-eighths of the bar. Fractions just tell you how many pieces you have out of the whole. The number below the line is always the total pieces — we call that the denominator — and the number on top is what you have, the numerator."`,
    rationale: "Candidate uses a concrete, tangible example (chocolate bar) that children relate to directly. Correctly names both parts of the fraction without losing the child-friendly tone. Confident pacing throughout.",
  },
  {
    id: "q2",
    label: "Question 2 · Empathy & Patience",
    question: "Describe how you would handle a student who is frustrated and ready to give up on a maths problem.",
    focus: "Temperament Focus",
    score: 91,
    transcript: `"First, I'd pause the problem entirely and just acknowledge how they feel — 'This is genuinely tricky and it's completely okay to feel stuck.' Then I'd ask them to show me the last step they understood, not the step they got stuck on, so we rebuild from solid ground rather than staring at the failure point."`,
    rationale: "Demonstrates strong emotional attunement — prioritises the student's emotional state before returning to content. 'Rebuilding from solid ground' is an effective de-escalation technique. Rated highly on empathy dimension.",
  },
];

type Decision = "Move Forward" | "Hold" | "Decline" | null;

export default function RecruiterReportDetail() {
  const [decision, setDecision] = useState<Decision>("Move Forward");
  const [notes, setNotes] = useState("");
  const [nextStep, setNextStep] = useState("Demo Teaching Session");

  const circumference = 2 * Math.PI * 88; // ≈ 553
  const offset = circumference * (1 - CANDIDATE.matchScore / 100);

  return (
    <div className="min-h-screen bg-background">

      {/* ── Top nav ────────────────────────────────────────────── */}
      <nav className="glass-header sticky top-0 z-50 shadow-sm shadow-slate-200/50">
        <div className="flex justify-between items-center w-full px-8 py-4">
          <div className="flex items-center gap-8">
            <Link href="/recruiter" className="text-2xl font-black text-on-secondary-fixed tracking-tighter">Chayan</Link>
            <div className="hidden md:flex gap-6 items-center">
              <Link href="/recruiter" className="text-on-surface-variant font-medium hover:text-primary transition-colors">Dashboard</Link>
              <Link href="#" className="text-primary font-bold border-b-2 border-primary-container pb-0.5">Candidates</Link>
              <Link href="#" className="text-on-surface-variant font-medium hover:text-primary transition-colors">Assessments</Link>
              <Link href="#" className="text-on-surface-variant font-medium hover:text-primary transition-colors">Analytics</Link>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-5 py-2 rounded-xl bg-surface-container-high text-primary font-bold text-sm flex items-center gap-2 active:scale-95 transition-all">
              <span className="material-symbols-outlined text-[18px]">download</span>
              Export PDF
            </button>
            <button className="px-5 py-2 rounded-xl premium-gradient text-white font-bold text-sm flex items-center gap-2 shadow-sm active:scale-95 transition-all">
              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>share</span>
              Share Report
            </button>
            <button className="p-2 rounded-full text-secondary hover:bg-surface-container-high transition-colors">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-white font-bold text-sm">HR</div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-8 lg:p-12">

        {/* ── Breadcrumb + header ─────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <nav className="flex gap-2 items-center mb-4 text-on-surface-variant">
              <Link href="/recruiter" className="text-[10px] font-bold uppercase tracking-widest hover:text-primary transition-colors">Dashboard</Link>
              <span className="material-symbols-outlined text-sm">chevron_right</span>
              <span className="text-[10px] font-bold uppercase tracking-widest">Candidate Report</span>
            </nav>
            <h1 className="text-5xl font-black tracking-tight text-on-secondary-fixed mb-2">{CANDIDATE.name}</h1>
            <p className="text-on-surface-variant text-lg">{CANDIDATE.role} — Tutor Screening Report</p>
          </div>
        </div>

        {/* ── Bento grid ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* ── Score circle ─── */}
          <div className="lg:col-span-4 bg-surface-container-lowest p-8 rounded-2xl shadow-sm flex flex-col justify-between items-center text-center">
            <div className="mb-6 w-full">
              <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block mb-8">Overall Match Score</span>
              <div className="relative w-48 h-48 flex items-center justify-center mx-auto">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 192 192">
                  <circle cx="96" cy="96" r="88" fill="transparent" stroke="currentColor" strokeWidth="12" className="text-surface-container-low" />
                  <circle
                    cx="96" cy="96" r="88"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="12"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="text-primary-container transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-black text-on-secondary-fixed">{CANDIDATE.matchScore}%</span>
                  <span className="text-xs font-bold text-tertiary">STRONG MATCH</span>
                </div>
              </div>
            </div>

            <div className="w-full space-y-3">
              {/* AI Recommendation */}
              <div className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 ${
                CANDIDATE.recommendation === "Move Forward"
                  ? "bg-tertiary/10 text-tertiary"
                  : "bg-error/10 text-error"
              }`}>
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {CANDIDATE.recommendation === "Move Forward" ? "verified" : "cancel"}
                </span>
                AI: {CANDIDATE.recommendation}
              </div>

              <div className="pt-4 border-t border-outline-variant/20">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-on-surface-variant">AI Confidence</span>
                  <span className="text-sm font-bold text-on-secondary-fixed">{CANDIDATE.confidence}%</span>
                </div>
                <div className="w-full h-2 bg-surface-container-low rounded-full overflow-hidden">
                  <div className="h-full bg-tertiary-container" style={{ width: `${CANDIDATE.confidence}%` }} />
                </div>
              </div>

              {/* Candidate meta */}
              <div className="pt-4 space-y-2 text-left">
                <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                  <span className="material-symbols-outlined text-primary text-[16px]">calendar_today</span>
                  Screened {CANDIDATE.screenedOn}
                </div>
                <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                  <span className="material-symbols-outlined text-primary text-[16px]">timer</span>
                  Duration: {CANDIDATE.duration}
                </div>
                <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                  <span className="material-symbols-outlined text-primary text-[16px]">mail</span>
                  {CANDIDATE.email}
                </div>
              </div>
            </div>
          </div>

          {/* ── Strengths & Risks ─── */}
          <div className="lg:col-span-8 bg-surface-container-lowest p-8 rounded-2xl shadow-sm">
            <div className="grid md:grid-cols-2 gap-10">
              <div>
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-on-secondary-fixed">
                  <span className="material-symbols-outlined text-tertiary">check_circle</span>
                  Key Strengths
                </h3>
                <ul className="space-y-4">
                  {STRENGTHS.map((s) => (
                    <li key={s.title} className="p-4 bg-tertiary/5 rounded-xl border-l-4 border-tertiary">
                      <p className="font-bold text-sm text-on-tertiary-container mb-1">{s.title}</p>
                      <p className="text-xs text-on-surface-variant">{s.body}</p>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-on-secondary-fixed">
                  <span className="material-symbols-outlined text-error">warning</span>
                  Identified Risks
                </h3>
                <ul className="space-y-4">
                  {RISKS.map((r) => (
                    <li key={r.title} className="p-4 bg-error/5 rounded-xl border-l-4 border-error">
                      <p className="font-bold text-sm text-on-error-container mb-1">{r.title}</p>
                      <p className="text-xs text-on-surface-variant">{r.body}</p>
                    </li>
                  ))}
                </ul>

                {/* Dimension scores */}
                <div className="mt-8">
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-4">Competency Scores</p>
                  <div className="space-y-3">
                    {DIMENSION_SCORES.map((d) => (
                      <div key={d.label}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-on-surface-variant">{d.label}</span>
                          <span className="font-bold text-on-secondary-fixed">{d.score}</span>
                        </div>
                        <div className="w-full h-1.5 bg-surface-container-low rounded-full overflow-hidden">
                          <div className="h-full bg-primary-container" style={{ width: `${d.score * 10}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Question history ─── */}
          <div className="lg:col-span-9 bg-surface-container-lowest p-8 rounded-2xl shadow-sm space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black text-on-secondary-fixed">Interview Breakdown</h3>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-surface-container text-[10px] font-bold rounded-full text-on-surface-variant uppercase">Transcript Available</span>
              </div>
            </div>

            {QUESTIONS.map((q) => (
              <div key={q.id} className="bg-background rounded-2xl overflow-hidden border border-outline-variant/10">
                <div className="p-6 border-b border-surface-container flex items-start justify-between">
                  <div className="flex-1">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{q.label}</span>
                    <h4 className="text-lg font-bold text-on-surface mt-1">{q.question}</h4>
                  </div>
                  <span className="bg-surface-container-high px-3 py-1 rounded-full text-xs font-bold text-on-surface ml-4 shrink-0">{q.focus}</span>
                </div>
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h5 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-3">AI Transcript</h5>
                      <p className="text-sm leading-relaxed text-on-surface italic">{q.transcript}</p>
                    </div>
                    <div className="bg-surface-container-low/50 p-4 rounded-xl">
                      <h5 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">AI Rationale</h5>
                      <p className="text-xs italic text-on-surface-variant leading-relaxed">{q.rationale}</p>
                      <div className="mt-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-tertiary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                        <span className="text-xs font-bold text-tertiary">Score: {q.score}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Decision panel ─── */}
          <div className="lg:col-span-3 space-y-6">
            <div className="sticky top-24 space-y-6">
              <div className="bg-on-secondary-fixed p-8 rounded-2xl text-white shadow-xl">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary-container">fact_check</span>
                  Decision Panel
                </h3>
                <div className="space-y-3">
                  {(["Move Forward", "Hold", "Decline"] as const).map((d) => (
                    <button
                      key={d}
                      onClick={() => setDecision(d)}
                      className={`w-full py-4 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm ${
                        decision === d
                          ? d === "Move Forward"
                            ? "bg-primary-container text-on-primary-fixed"
                            : d === "Hold"
                            ? "bg-secondary-container text-on-secondary-fixed"
                            : "bg-error text-white"
                          : "bg-white/10 hover:bg-white/20 text-white border border-white/10"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {d === "Move Forward" ? "arrow_forward" : d === "Hold" ? "pause" : "close"}
                      </span>
                      {d}
                    </button>
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t border-white/10 space-y-4">
                  <div>
                    <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2">Internal Notes</p>
                    <textarea
                      className="w-full bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/25 p-3 h-24 focus:outline-none focus:ring-1 focus:ring-primary-container resize-none"
                      placeholder="Add a note for the hiring manager…"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2">Next Step</p>
                    <div className="relative">
                      <select
                        className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary-container"
                        value={nextStep}
                        onChange={(e) => setNextStep(e.target.value)}
                      >
                        <option>Demo Teaching Session</option>
                        <option>Background Verification</option>
                        <option>HR Interview</option>
                        <option>Offer Discussion</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/50 text-[18px]">expand_more</span>
                    </div>
                  </div>

                  <button className="w-full premium-gradient text-white py-4 rounded-xl font-bold shadow-lg active:scale-95 transition-all text-sm">
                    Confirm &amp; Notify Candidate
                  </button>
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/10">
                <div className="flex items-center gap-3 mb-5">
                  <span className="material-symbols-outlined text-on-secondary-fixed text-[20px]">history</span>
                  <h4 className="font-bold text-on-secondary-fixed text-sm">Screening Timeline</h4>
                </div>
                <div className="space-y-4">
                  {[
                    { label: "Invite Sent",           sub: "12 Apr, 9:00 AM",   done: true  },
                    { label: "Screening Completed",   sub: "12 Apr, 10:42 AM",  done: true  },
                    { label: "AI Report Generated",   sub: "12 Apr, 10:45 AM",  done: true  },
                    { label: "Recruiter Review",      sub: "Pending",           done: false },
                  ].map((t, i, arr) => (
                    <div key={t.label} className="flex gap-4 relative">
                      <div className={`w-2 h-2 rounded-full mt-2 shrink-0 z-10 ${t.done ? "bg-tertiary" : "bg-outline-variant"}`} />
                      {i < arr.length - 1 && (
                        <div className="absolute left-[3px] top-4 w-px h-8 bg-outline-variant" />
                      )}
                      <div>
                        <p className={`text-xs font-bold ${t.done ? "text-on-surface" : "text-on-surface-variant"}`}>{t.label}</p>
                        <p className="text-[10px] text-on-surface-variant">{t.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
