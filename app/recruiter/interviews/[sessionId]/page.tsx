"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import Header from "../../../components/recruiter/Header";

type Decision = "Move Forward" | "Hold" | "Decline" | null;

export default function RecruiterReportDetail() {
  const { sessionId } = useParams();
  const router = useRouter();
  
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [decision, setDecision] = useState<Decision>("Move Forward");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch(`/api/recruiter/interviews/${sessionId}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setSession(data.session);
        
        // Load existing decision if any
        if (data.session.recruiterDecision) {
          const d = data.session.recruiterDecision.decision;
          setDecision(d === "MOVE_FORWARD" ? "Move Forward" : d === "HOLD" ? "Hold" : "Decline");
          setNotes(data.session.recruiterDecision.notes || "");
        }
      } catch (err) {
        console.error(err);
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
      console.error(error);
      alert("Error saving decision.");
    } finally {
      setSaving(false);
    }
  };

  const togglePlay = (id: string, url: string) => {
    if (playingId === id) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play();
      } else {
        const audio = new Audio(url);
        audio.onended = () => setPlayingId(null);
        audioRef.current = audio;
        audio.play();
      }
      setPlayingId(id);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin w-10 h-10 text-primary" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <p className="text-on-surface-variant font-medium">Loading report data...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Interview Not Found</h1>
        <Link href="/recruiter" className="text-primary font-bold hover:underline">Return to Dashboard</Link>
      </div>
    );
  }

  const CANDIDATE_DATA = {
    name: session.candidate.name,
    initials: session.candidate.name.split(" ").map((n: any) => n[0]).join("").toUpperCase().slice(0, 2),
    email: session.candidate.email,
    screenedOn: new Date(session.completedAt || session.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
    matchScore: session.finalReport?.overallScore ? Math.round(session.finalReport.overallScore * 20) : 0, // Scale 1-5 to 1-100
    confidence: session.finalReport?.confidence ? Math.round(session.finalReport.confidence * 100) : 0,
    recommendation: session.finalReport?.recommendation || "Needs Review",
  };

  const circumference = 2 * Math.PI * 88;
  const offset = circumference * (1 - CANDIDATE_DATA.matchScore / 100);

  const competencyRadar = session.finalReport?.dimensionScores ? [
    { label: "Communication", score: session.finalReport.dimensionScores.communicationClarity },
    { label: "Pedagogy", score: session.finalReport.dimensionScores.conceptExplanation },
    { label: "Empathy", score: session.finalReport.dimensionScores.empathyAndPatience },
    { label: "Professionalism", score: session.finalReport.dimensionScores.professionalism },
  ] : [];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="max-w-[1920px] mx-auto p-6 md:p-8 lg:p-12">
        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 md:mb-12">
          <div>
            <nav className="flex gap-2 items-center mb-4 text-on-surface-variant no-print">
              <Link href="/recruiter" className="text-[10px] font-bold uppercase tracking-widest hover:text-primary transition-colors">Candidates</Link>
              <span className="material-symbols-outlined text-sm">chevron_right</span>
              <span className="text-[10px] font-bold uppercase tracking-widest">Technical Interview</span>
            </nav>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-on-secondary-fixed mb-2">{CANDIDATE_DATA.name}&apos;s Analysis</h1>
            <p className="text-on-surface-variant text-base md:text-lg max-w-xl">AI-generated evaluation report for screening.</p>
          </div>
          <div className="flex gap-3 flex-shrink-0 no-print">
            <button onClick={() => window.print()} className="px-5 py-3 rounded-xl bg-surface-container-high text-primary font-bold text-sm flex items-center gap-2 active:scale-95 transition-all">
              <span className="material-symbols-outlined text-[18px]">download</span><span className="hidden sm:inline">Export PDF</span>
            </button>
            <button 
              onClick={async () => {
                const text = `Chayan AI Report for ${CANDIDATE_DATA.name}\nScore: ${CANDIDATE_DATA.matchScore}%\nRecommendation: ${CANDIDATE_DATA.recommendation}\nURL: ${window.location.href}`;
                await navigator.clipboard.writeText(text);
                alert("Report link copied!");
              }}
              className="px-5 py-3 rounded-xl premium-gradient text-white font-bold text-sm flex items-center gap-2 shadow-lg active:scale-95 transition-all"
            >
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
                  <span className="text-5xl font-black text-on-secondary-fixed">{CANDIDATE_DATA.matchScore}%</span>
                  <span className="text-xs font-bold text-tertiary">{CANDIDATE_DATA.matchScore >= 80 ? 'EXCEPTIONAL' : CANDIDATE_DATA.matchScore >= 60 ? 'STRONG' : 'NEEDS REVIEW'}</span>
                </div>
              </div>
            </div>
            <div className="w-full pt-6 border-t border-outline-variant/20">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-on-surface-variant">AI Confidence</span>
                <span className="text-sm font-bold text-on-secondary-fixed">{CANDIDATE_DATA.confidence >= 80 ? 'High' : 'Moderate'} ({CANDIDATE_DATA.confidence}%)</span>
              </div>
              <div className="w-full h-2 bg-surface-container-low rounded-full overflow-hidden">
                <div className="h-full bg-tertiary-container" style={{ width: `${CANDIDATE_DATA.confidence}%` }} />
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
                  {session.finalReport?.strengths.map((s: string, i: number) => (
                    <li key={i} className="p-4 bg-tertiary/5 rounded-xl border-l-4 border-tertiary">
                      <p className="text-xs text-on-surface-variant font-medium leading-relaxed">{s}</p>
                    </li>
                  )) || <li className="text-xs text-on-surface-variant italic">No specific strengths highlighted.</li>}
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-on-secondary-fixed">
                  <span className="material-symbols-outlined text-error">warning</span>Identified Risks
                </h3>
                <ul className="space-y-4">
                  {session.finalReport?.risks.map((r: string, i: number) => (
                    <li key={i} className="p-4 bg-error/5 rounded-xl border-l-4 border-error">
                      <p className="text-xs text-on-surface-variant font-medium leading-relaxed">{r}</p>
                    </li>
                  )) || <li className="text-xs text-on-surface-variant italic">No major risks identified.</li>}
                </ul>
              </div>
            </div>
          </div>

          {/* Question History */}
          <div className="lg:col-span-9 bg-surface-container-lowest p-6 md:p-8 rounded-2xl shadow-sm border border-outline-variant/5 space-y-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h3 className="text-2xl font-black text-on-secondary-fixed">Interview Evidence</h3>
              <div className="flex gap-2 flex-wrap no-print">
                <span className="px-3 py-1 bg-surface-container text-[10px] font-bold rounded-full text-on-surface-variant uppercase">Transcript Ready</span>
                <span className="px-3 py-1 bg-surface-container text-[10px] font-bold rounded-full text-on-surface-variant uppercase">Voice Authenticated</span>
              </div>
            </div>

            {/* Transcript & Audio */}
            <div className="space-y-10">
              {session.answers.map((answer: any, idx: number) => (
                <div key={answer.id} className="space-y-6 pb-10 border-b border-outline-variant/10 last:border-0 last:pb-0">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-secondary">smart_toy</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-tight">Question {idx + 1}</p>
                      <p className="text-on-surface leading-relaxed font-bold italic">&quot;{answer.question?.prompt || questions[idx]?.prompt}&quot;</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary-container/20 flex items-center justify-center flex-shrink-0 text-primary font-bold text-sm">
                      {CANDIDATE_DATA.initials}
                    </div>
                    <div className="bg-surface-container-low p-5 rounded-xl flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-4">
                        <p className="text-xs font-bold text-on-surface-variant uppercase tracking-tight">
                          Candidate Response • {new Date(answer.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <button 
                          onClick={() => togglePlay(answer.id, answer.audioObjectKey)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${playingId === answer.id ? 'bg-primary text-white scale-110 shadow-lg' : 'bg-white/50 text-primary hover:bg-white hover:scale-105'}`}
                        >
                          <span className="material-symbols-outlined text-[18px]">{playingId === answer.id ? 'pause' : 'play_arrow'}</span>
                        </button>
                      </div>
                      
                      <p className="text-on-secondary-fixed leading-relaxed text-sm">
                        &quot;{answer.transcript?.text || "Processing transcript..."}&quot;
                      </p>
                      
                      {answer.evaluation?.evidence && (
                        <div className="mt-4 flex gap-2 flex-wrap">
                          {answer.evaluation.evidence.map((tag: string) => (
                            <span key={tag} className="px-2 py-1 bg-tertiary/10 text-tertiary text-[10px] font-bold rounded uppercase tracking-tighter">{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Decision Panel sidebar */}
          <div className="lg:col-span-3 space-y-6 no-print">
            <div className="lg:sticky lg:top-24 space-y-6">
              <div className="bg-on-secondary-fixed p-6 md:p-8 rounded-2xl text-white shadow-xl">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary-container">fact_check</span>Decision Panel
                </h3>
                <div className="space-y-3">
                  <button onClick={() => setDecision("Move Forward")} className={`w-full py-4 font-black rounded-xl transition-all flex items-center justify-center gap-2 text-sm group ${decision === "Move Forward" ? "bg-primary-container text-on-primary-fixed" : "bg-white/10 text-white border border-white/10 hover:bg-white/20"}`}>
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
                
                <button 
                  disabled={saving}
                  onClick={handleSaveDecision}
                  className="w-full mt-6 bg-primary-container text-on-primary-fixed py-4 rounded-xl font-bold shadow-lg active:scale-95 transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : (
                    <>
                      <span className="material-symbols-outlined">save</span>
                      Confirm Decision
                    </>
                  )}
                </button>
              </div>

              <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/10">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-4">Competency Radar</p>
                <div className="space-y-3">
                  {competencyRadar.map((d) => (
                    <div key={d.label}>
                      <div className="flex justify-between text-xs mb-1"><span className="text-on-surface-variant">{d.label}</span><span className="font-bold text-on-secondary-fixed">{d.score}/5</span></div>
                      <div className="w-full h-1 bg-surface-container-low rounded-full overflow-hidden"><div className="h-full bg-primary-container" style={{ width: `${d.score * 20}%` }} /></div>
                    </div>
                  ))}
                  {competencyRadar.length === 0 && <p className="text-[10px] text-on-surface-variant italic">No data available.</p>}
                </div>
              </div>

              <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/10">
                <div className="flex items-center gap-3 mb-5">
                  <span className="material-symbols-outlined text-on-secondary-fixed text-[20px]">info</span>
                  <h4 className="font-bold text-on-secondary-fixed text-sm">Assessment Info</h4>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Candidate Email</p>
                    <p className="text-xs font-medium text-on-surface truncate">{CANDIDATE_DATA.email}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Screening Date</p>
                    <p className="text-xs font-medium text-on-surface">{CANDIDATE_DATA.screenedOn}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <button className="fixed bottom-6 right-6 w-14 h-14 premium-gradient text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-90 transition-all z-50 lg:hidden no-print">
        <span className="material-symbols-outlined text-2xl">send</span>
      </button>
    </div>
  );
}
