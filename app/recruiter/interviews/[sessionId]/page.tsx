"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type Decision = "Move Forward" | "Hold" | "Decline" | null;

export default function RecruiterReportDetail() {
  const { sessionId } = useParams();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [decision, setDecision] = useState<Decision>("Move Forward");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch(`/api/recruiter/interviews/${sessionId}`);
        if (res.ok) {
          const data = await res.json();
          setSession(data.session);
          if (data.session.recruiterDecision) {
            const d = data.session.recruiterDecision.decision;
            setDecision(d === "MOVE_FORWARD" ? "Move Forward" : d === "HOLD" ? "Hold" : "Decline");
            setNotes(data.session.recruiterDecision.notes || "");
          }
        }
      } catch (error) {
        console.error("Failed to fetch session:", error);
      } finally {
        setLoading(false);
      }
    }
    if (sessionId) fetchSession();
  }, [sessionId]);

  const handleSaveDecision = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/recruiter/interviews/${sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, notes, reviewerId: "recruiter-1" }),
      });
      if (res.ok) {
        alert("Decision saved successfully!");
      } else {
        alert("Failed to save decision.");
      }
    } catch (error) {
      console.error("Failed to save decision:", error);
      alert("Error saving decision.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <svg className="animate-spin w-10 h-10 text-primary" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-center p-6">
        <h1 className="text-2xl font-bold mb-4">Interview Not Found</h1>
        <Link href="/recruiter" className="text-primary hover:underline">Return to Dashboard</Link>
      </div>
    );
  }

  const CANDIDATE_DATA = {
    name: session.candidate.name,
    initials: session.candidate.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2),
    role: "Candidate",
    email: session.candidate.email,
    screenedOn: new Date(session.completedAt || session.createdAt).toLocaleDateString(),
    recommendation: session.finalReport?.recommendation || "Needs Review",
    matchScore: session.finalReport?.overallScore ? Math.round(session.finalReport.overallScore * 20) : 0,
    confidence: session.finalReport?.confidence ? Math.round(session.finalReport.confidence * 100) : 0,
  };

  const circumference = 2 * Math.PI * 88;
  const offset = circumference * (1 - CANDIDATE_DATA.matchScore / 100);

  return (
    <div className="min-h-screen bg-background">

      {/* ── Top nav ────────────────────────────────────────────── */}
      <nav className="glass-header sticky top-0 z-50 shadow-[0_4px_20px_rgba(73,95,132,0.04)] no-print">
        <div className="flex justify-between items-center w-full px-6 md:px-8 py-4 max-w-[1920px] mx-auto">
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
            <button className="p-2 rounded-full text-secondary hover:bg-surface-container-high transition-colors hidden sm:block">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button className="p-2 rounded-full text-secondary hover:bg-surface-container-high transition-colors hidden sm:block">
              <span className="material-symbols-outlined">settings</span>
            </button>
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-white font-bold text-sm">HR</div>
          </div>
        </div>
      </nav>

      <div className="max-w-[1920px] mx-auto">
        <div className="p-6 md:p-8 lg:p-12">

          {/* ── Breadcrumb + header ─────────────────────────────── */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 md:mb-12">
            <div>
              <nav className="flex gap-2 items-center mb-4 text-on-surface-variant no-print">
                <Link href="/recruiter" className="text-[10px] font-bold uppercase tracking-widest hover:text-primary transition-colors">Candidates</Link>
                <span className="material-symbols-outlined text-sm">chevron_right</span>
                <span className="text-[10px] font-bold uppercase tracking-widest">Technical Interview</span>
              </nav>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-on-secondary-fixed mb-2">{CANDIDATE_DATA.name}&apos;s Analysis</h1>
              <p className="text-on-surface-variant text-base md:text-lg max-w-xl">Detailed behavioral and technical competency report generated by Chayan AI.</p>
            </div>
            <div className="flex gap-3 flex-shrink-0 no-print">
              <button
                onClick={() => window.print()}
                className="px-5 py-3 rounded-xl bg-surface-container-high text-primary font-bold text-sm flex items-center gap-2 active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
                Export PDF
              </button>
              <button
                onClick={async () => {
                  const text = `Chayan AI Assessment Report for ${CANDIDATE_DATA.name}\nRecommendation: ${CANDIDATE_DATA.recommendation}\nScore: ${CANDIDATE_DATA.matchScore}%\nConfidence: ${CANDIDATE_DATA.confidence}%\n\nView full report at: ${window.location.href}`;
                  await navigator.clipboard.writeText(text);
                  alert("Report summary copied to clipboard!");
                }}
                className="px-5 py-3 rounded-xl premium-gradient text-white font-bold text-sm flex items-center gap-2 shadow-lg active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>share</span>
                Share Report
              </button>
            </div>
          </div>

          {/* ── Bento grid ─────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* ── Score circle card ─── */}
            <div className="lg:col-span-4 bg-surface-container-lowest p-8 rounded-2xl shadow-[0_4px_20px_rgba(73,95,132,0.04)] flex flex-col justify-between items-center text-center">
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
                    <span className="text-5xl font-black text-on-secondary-fixed">{CANDIDATE_DATA.matchScore}%</span>
                    <span className="text-xs font-bold text-tertiary uppercase">
                      {CANDIDATE_DATA.matchScore >= 80 ? "EXCEPTIONAL" : CANDIDATE_DATA.matchScore >= 60 ? "STRONG" : "AVERAGE"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="w-full pt-6 border-t border-outline-variant/20">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-on-surface-variant">AI Confidence</span>
                  <span className="text-sm font-bold text-on-secondary-fixed">
                    {CANDIDATE_DATA.confidence >= 80 ? "High" : CANDIDATE_DATA.confidence >= 50 ? "Moderate" : "Low"} ({CANDIDATE_DATA.confidence}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-surface-container-low rounded-full overflow-hidden">
                  <div className="h-full bg-tertiary-container" style={{ width: `${CANDIDATE_DATA.confidence}%` }} />
                </div>
              </div>
            </div>

            {/* ── Strengths & Risks ─── */}
            <div className="lg:col-span-8 bg-surface-container-lowest p-6 md:p-8 rounded-2xl shadow-[0_4px_20px_rgba(73,95,132,0.04)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                <div>
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-on-secondary-fixed">
                    <span className="material-symbols-outlined text-tertiary">check_circle</span>
                    Key Strengths
                  </h3>
                  <ul className="space-y-4">
                    {session.finalReport?.strengths.map((s: string, i: number) => (
                      <li key={i} className="p-4 bg-tertiary/5 rounded-xl border-l-4 border-tertiary">
                        <p className="font-bold text-sm text-on-tertiary-container mb-1">Strength</p>
                        <p className="text-xs text-on-surface-variant">{s}</p>
                      </li>
                    )) || <li className="text-sm text-on-surface-variant italic">No specific strengths highlighted.</li>}
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-on-secondary-fixed">
                    <span className="material-symbols-outlined text-error">warning</span>
                    Identified Risks
                  </h3>
                  <ul className="space-y-4">
                    {session.finalReport?.risks.map((r: string, i: number) => (
                      <li key={i} className="p-4 bg-error/5 rounded-xl border-l-4 border-error">
                        <p className="font-bold text-sm text-on-error-container mb-1">Risk</p>
                        <p className="text-xs text-on-surface-variant">{r}</p>
                      </li>
                    )) || <li className="text-sm text-on-surface-variant italic">No critical risks identified.</li>}
                  </ul>
                </div>
              </div>
            </div>

            {/* ── Question History ─── */}
            <div className="lg:col-span-9 bg-surface-container-lowest p-6 md:p-8 rounded-2xl shadow-[0_4px_20px_rgba(73,95,132,0.04)] space-y-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h3 className="text-2xl font-black text-on-secondary-fixed">Question History</h3>
                <div className="flex gap-2 no-print">
                  <span className="px-3 py-1 bg-surface-container text-[10px] font-bold rounded-full text-on-surface-variant uppercase">Transcript Available</span>
                  <span className="px-3 py-1 bg-surface-container text-[10px] font-bold rounded-full text-on-surface-variant uppercase">Audio Synced</span>
                </div>
              </div>

              {/* Transcript */}
              <div className="space-y-8">
                {session.answers.map((a: any) => (
                  <div key={a.id} className="space-y-4 border-b border-outline-variant/10 pb-6 last:border-0">
                    {/* Question */}
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-secondary">help_outline</span>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-on-surface-variant mb-1 uppercase tracking-widest">Question</p>
                        <p className="text-on-surface font-bold leading-relaxed italic">&quot;{a.question.prompt}&quot;</p>
                      </div>
                    </div>

                    {/* Candidate response */}
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary-container/20 flex items-center justify-center flex-shrink-0 text-primary font-bold text-sm">
                        {CANDIDATE_DATA.initials}
                      </div>
                      <div className="bg-surface-container-low p-5 rounded-xl flex-1">
                        <p className="text-[10px] font-bold text-on-surface-variant mb-2 uppercase tracking-widest">Transcript • {new Date(a.createdAt).toLocaleTimeString()}</p>
                        <p className="text-on-secondary-fixed leading-relaxed text-sm">
                          &quot;{a.transcript?.text}&quot;
                        </p>
                        <div className="mt-4 flex gap-2 flex-wrap no-print">
                          {a.evaluation?.evidence.map((sig: string, i: number) => (
                            <span key={i} className="px-2 py-1 bg-tertiary/10 text-tertiary text-[10px] font-bold rounded uppercase tracking-tighter">{sig}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Decision panel sidebar ─── */}
            <div className="lg:col-span-3 space-y-6">
              <div className="lg:sticky lg:top-24 space-y-6">
                {/* Dark decision panel */}
                <div className="bg-on-secondary-fixed p-6 md:p-8 rounded-2xl text-white shadow-xl no-print">
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
                              ? "bg-white/20 text-white"
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
                        placeholder="Add a note to the hiring manager…"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </div>
                  </div>

                  <button
                    disabled={saving}
                    onClick={handleSaveDecision}
                    className="w-full mt-6 bg-primary-container text-on-primary-fixed py-4 rounded-xl font-bold shadow-lg active:scale-95 transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {saving ? (
                      <svg className="animate-spin h-5 w-5 text-on-primary-fixed" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                    ) : (
                      <>
                        <span className="material-symbols-outlined">save</span>
                        Confirm Decision
                      </>
                    )}
                  </button>
                </div>

                {/* Print-only Decision Summary */}
                <div className="hidden print:block bg-surface-container-low p-6 rounded-2xl border border-outline-variant/30">
                  <h3 className="text-sm font-bold mb-4 uppercase tracking-widest">Recruiter Decision</h3>
                  <p className="text-lg font-black mb-2">{decision}</p>
                  <div className="mt-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Notes</p>
                    <p className="text-sm mt-1">{notes || "No notes provided."}</p>
                  </div>
                </div>

                {/* Summary card */}
                <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/10">
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-4">Assessment Summary</p>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Recommendation</p>
                      <p className="text-sm font-bold text-on-secondary-fixed">{CANDIDATE_DATA.recommendation}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Overall Score</p>
                      <p className="text-sm font-bold text-on-secondary-fixed">{CANDIDATE_DATA.matchScore}/100</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Date Screened</p>
                      <p className="text-sm font-bold text-on-secondary-fixed">{CANDIDATE_DATA.screenedOn}</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile FAB */}
      <button className="fixed bottom-6 right-6 w-14 h-14 premium-gradient text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-90 transition-all z-50 lg:hidden no-print">
        <span className="material-symbols-outlined text-2xl">send</span>
      </button>
    </div>
  );
}
