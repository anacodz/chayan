"use client";

import Link from "next/link";
import { useState } from "react";
import Header from "../../../components/recruiter/Header";

type Decision = "Move Forward" | "Hold" | "Decline" | null;

/* ── Static demo data ────────────────────────────────────────── */
const CANDIDATE = {
  name: "Chayan", initials: "CH", role: "Senior Curriculum Developer",
  email: "chayan.curriculum@example.com", phone: "+91 98765 43210",
  screenedOn: "Oct 24, 2023", duration: "18m 42s",
  matchScore: 88, confidence: 96,
  recommendation: "Move Forward" as const,
};

const STRENGTHS = [
  { title: "Strong Pedagogy",  body: "Demonstrated deep understanding of inquiry-based learning models during live task." },
  { title: "Clarity of Voice", body: "Exceptional voice quality and modulation, suitable for video lesson creation." },
  { title: "Critical Thinking", body: "Solved the curriculum logic puzzle 40% faster than the department average." },
];

const RISKS = [
  { title: "Tool Familiarity",  body: "Slight hesitation with advanced CMS features. May require 1-week training." },
  { title: "Relocation Intent", body: "Unclear regarding Bangalore hub availability; requires verbal confirmation." },
];

const COMPETENCY_RADAR = [
  { label: "Subject Expertise", score: 9.5 },
  { label: "Communication",     score: 9.0 },
  { label: "Tech Proficiency",  score: 7.2 },
];

const Q1_TAGS = ["PEDAGOGY FOUNDATION +", "STUDENT-CENTRIC +"];

export default function RecruiterReportDetail() {
  const [decision, setDecision] = useState<Decision>("Move Forward");
  const [notes, setNotes] = useState("");

  const circumference = 2 * Math.PI * 88;
  const offset = circumference * (1 - CANDIDATE.matchScore / 100);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="max-w-[1920px] mx-auto p-6 md:p-8 lg:p-12">
        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 md:mb-12">
          <div>
            <nav className="flex gap-2 items-center mb-4 text-on-surface-variant">
              <Link href="/recruiter" className="text-[10px] font-bold uppercase tracking-widest hover:text-primary transition-colors">Candidates</Link>
              <span className="material-symbols-outlined text-sm">chevron_right</span>
              <span className="text-[10px] font-bold uppercase tracking-widest">Technical Interview</span>
            </nav>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-on-secondary-fixed mb-2">{CANDIDATE.name}&apos;s Analysis</h1>
            <p className="text-on-surface-variant text-base md:text-lg max-w-xl">Detailed behavioral and technical competency report for the {CANDIDATE.role} role.</p>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <button className="px-5 py-3 rounded-xl bg-surface-container-high text-primary font-bold text-sm flex items-center gap-2 active:scale-95 transition-all">
              <span className="material-symbols-outlined text-[18px]">download</span><span className="hidden sm:inline">Export PDF</span>
            </button>
            <button className="px-5 py-3 rounded-xl premium-gradient text-white font-bold text-sm flex items-center gap-2 shadow-lg active:scale-95 transition-all">
              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>share</span><span className="hidden sm:inline">Share Report</span>
            </button>
          </div>
        </div>

        {/* ── Bento grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Score */}
          <div className="lg:col-span-4 bg-surface-container-lowest p-8 rounded-2xl shadow-sm border border-outline-variant/5 flex flex-col justify-between items-center text-center">
            <div className="mb-6 w-full">
              <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block mb-8">Overall Match Score</span>
              <div className="relative w-48 h-48 flex items-center justify-center mx-auto">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 192 192">
                  <circle cx="96" cy="96" r="88" fill="transparent" stroke="currentColor" strokeWidth="12" className="text-surface-container-low" />
                  <circle cx="96" cy="96" r="88" fill="transparent" stroke="currentColor" strokeWidth="12" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="text-primary-container transition-all duration-1000" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-black text-on-secondary-fixed">{CANDIDATE.matchScore}%</span>
                  <span className="text-xs font-bold text-tertiary">EXCEPTIONAL</span>
                </div>
              </div>
            </div>
            <div className="w-full pt-6 border-t border-outline-variant/20">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-on-surface-variant">AI Confidence</span>
                <span className="text-sm font-bold text-on-secondary-fixed">High ({CANDIDATE.confidence}%)</span>
              </div>
              <div className="w-full h-2 bg-surface-container-low rounded-full overflow-hidden">
                <div className="h-full bg-tertiary-container" style={{ width: `${CANDIDATE.confidence}%` }} />
              </div>
            </div>
          </div>

          {/* Strengths & Risks */}
          <div className="lg:col-span-8 bg-surface-container-lowest p-6 md:p-8 rounded-2xl shadow-sm border border-outline-variant/5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
              <div>
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-on-secondary-fixed">
                  <span className="material-symbols-outlined text-tertiary">check_circle</span>Key Strengths
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
                  <span className="material-symbols-outlined text-error">warning</span>Identified Risks
                </h3>
                <ul className="space-y-4">
                  {RISKS.map((r) => (
                    <li key={r.title} className="p-4 bg-error/5 rounded-xl border-l-4 border-error">
                      <p className="font-bold text-sm text-on-error-container mb-1">{r.title}</p>
                      <p className="text-xs text-on-surface-variant">{r.body}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Question History */}
          <div className="lg:col-span-9 bg-surface-container-lowest p-6 md:p-8 rounded-2xl shadow-sm border border-outline-variant/5 space-y-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h3 className="text-2xl font-black text-on-secondary-fixed">Question History</h3>
              <div className="flex gap-2 flex-wrap">
                <span className="px-3 py-1 bg-surface-container text-[10px] font-bold rounded-full text-on-surface-variant uppercase">Transcript Available</span>
                <span className="px-3 py-1 bg-surface-container text-[10px] font-bold rounded-full text-on-surface-variant uppercase">Audio Synced</span>
              </div>
            </div>

            {/* Audio Player */}
            <div className="bg-surface-container-low rounded-xl p-4 md:p-6 flex flex-col sm:flex-row items-center gap-4 md:gap-6">
              <button className="w-12 h-12 flex items-center justify-center premium-gradient text-white rounded-full shadow-md active:scale-90 transition-transform flex-shrink-0">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
              </button>
              <div className="flex-1 flex flex-col gap-2 w-full">
                <div className="flex items-end gap-[2px] h-8">
                  {[4,6,8,5,7,4,6,8,5,3,5,7,4,6,3,8,4,6,2,5].map((h, i) => (
                    <div key={i} className={`w-1 rounded-full ${i < 7 ? 'bg-primary' : i < 10 ? 'bg-primary/40' : 'bg-primary/20'}`} style={{ height: `${h * 4}px` }} />
                  ))}
                </div>
                <div className="flex justify-between text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                  <span>02:14</span><span>04:50</span>
                </div>
              </div>
              <div className="flex items-center gap-4 border-t sm:border-t-0 sm:border-l border-outline-variant/30 pt-4 sm:pt-0 sm:pl-6 flex-shrink-0 w-full sm:w-auto justify-center sm:justify-start">
                <div className="text-right">
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase">Voice Quality</p>
                  <p className="text-sm font-black text-tertiary">98.2%</p>
                </div>
                <span className="material-symbols-outlined text-on-secondary-container">equalizer</span>
              </div>
            </div>

            {/* Transcript */}
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-secondary">smart_toy</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-tight">AI Interviewer • 01:45</p>
                  <p className="text-on-surface leading-relaxed italic">&quot;Can you walk me through your process for designing a math module for 5th graders that covers fractions while maintaining high student engagement?&quot;</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary-container/20 flex items-center justify-center flex-shrink-0 text-primary font-bold text-sm">CH</div>
                <div className="bg-surface-container-low p-4 rounded-xl flex-1 min-w-0">
                  <p className="text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-tight">{CANDIDATE.name} • 02:02</p>
                  <p className="text-on-secondary-fixed leading-relaxed">&quot;Absolutely. I start with the &apos;Hook&apos;—usually a real-world scenario like dividing a pizza or a garden plot. I believe students learn best when they don&apos;t realize they&apos;re doing complex calculations until the abstract concept is introduced later. For 5th graders, visual manipulatives are key...&quot;</p>
                  <div className="mt-4 flex gap-2 flex-wrap">
                    {Q1_TAGS.map((tag) => (
                      <span key={tag} className="px-2 py-1 bg-tertiary/10 text-tertiary text-[10px] font-bold rounded">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Decision Panel sidebar */}
          <div className="lg:col-span-3 space-y-6">
            <div className="lg:sticky lg:top-24 space-y-6">
              <div className="bg-on-secondary-fixed p-6 md:p-8 rounded-2xl text-white shadow-xl">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary-container">fact_check</span>Decision Panel
                </h3>
                <div className="space-y-3">
                  <button onClick={() => setDecision("Move Forward")} className={`w-full py-4 font-black rounded-xl transition-all flex items-center justify-center gap-2 text-sm group ${decision === "Move Forward" ? "bg-[#FFBA07] hover:bg-[#FFD258] text-[#271900]" : "bg-white/10 text-white border border-white/10 hover:bg-white/20"}`}>
                    Move Forward
                    <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </button>
                  <button onClick={() => setDecision("Hold")} className={`w-full py-4 font-bold rounded-xl transition-all text-sm border ${decision === "Hold" ? "bg-white/20 text-white border-white/20" : "bg-white/10 hover:bg-white/20 text-white border-white/10"}`}>
                    Put on Hold
                  </button>
                  <button onClick={() => setDecision("Decline")} className={`w-full py-4 font-bold rounded-xl transition-all text-sm ${decision === "Decline" ? "bg-error text-white" : "bg-transparent hover:bg-error/20 text-error-container"}`}>
                    Decline
                  </button>
                </div>
                <div className="mt-8 pt-6 border-t border-white/10">
                  <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2">Internal Notes</p>
                  <textarea className="w-full bg-white/5 border-none rounded-lg text-sm text-white focus:ring-1 focus:ring-primary-container placeholder:text-white/20 p-3 h-24 resize-none" placeholder="Add a note to the hiring manager..." value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
              </div>

              <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/10">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-4">Competency Radar</p>
                <div className="space-y-3">
                  {COMPETENCY_RADAR.map((d) => (
                    <div key={d.label}>
                      <div className="flex justify-between text-xs mb-1"><span className="text-on-surface-variant">{d.label}</span><span className="font-bold text-on-secondary-fixed">{d.score}</span></div>
                      <div className="w-full h-1 bg-surface-container-low rounded-full overflow-hidden"><div className="h-full bg-primary-container" style={{ width: `${d.score * 10}%` }} /></div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/10">
                <div className="flex items-center gap-3 mb-5">
                  <span className="material-symbols-outlined text-on-secondary-fixed text-[20px]">history</span>
                  <h4 className="font-bold text-on-secondary-fixed text-sm">Screening Timeline</h4>
                </div>
                <div className="space-y-4">
                  {[
                    { label: "Screening Completed", sub: "Oct 24, 10:45 AM", done: true },
                    { label: "AI Report Generated", sub: "Oct 24, 11:05 AM", done: true },
                    { label: "Review Pending",      sub: "Current Stage",    done: false },
                  ].map((t, i, arr) => (
                    <div key={t.label} className="flex gap-4 relative">
                      <div className={`w-2 h-2 rounded-full mt-2 shrink-0 z-10 ${t.done ? "bg-tertiary" : "bg-outline-variant"}`} />
                      {i < arr.length - 1 && <div className="absolute left-[3px] top-4 w-px h-8 bg-outline-variant" />}
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

      <button className="fixed bottom-6 right-6 w-14 h-14 premium-gradient text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-90 transition-all z-50 lg:hidden">
        <span className="material-symbols-outlined text-2xl">send</span>
      </button>
    </div>
  );
}
