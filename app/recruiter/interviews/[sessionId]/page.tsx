"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Header from "../../../components/recruiter/Header";
import Waveform from "../../../components/recruiter/Waveform";
import { exportToPDF } from "@/lib/pdf";

type Decision = "Move Forward" | "Hold" | "Decline" | "Needs Review" | null;

const TranscriptEditor = ({ 
  transcript, 
  onSave 
}: { 
  transcript: { id: string; text: string; correctedText?: string | null };
  onSave: (id: string, text: string) => Promise<boolean>
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(transcript.text);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    const success = await onSave(transcript.id, editedText);
    setIsSaving(false);
    if (success) {
      setIsEditing(false);
    } else {
      alert("Failed to save transcript.");
    }
  };

  if (isEditing) {
    return (
      <div className="space-y-2 w-full mt-2">
        <textarea 
          className="w-full bg-white border border-outline-variant/30 rounded-lg p-3 text-sm min-h-[100px] focus:ring-1 focus:ring-primary shadow-inner"
          value={editedText}
          onChange={(e) => setEditedText(e.target.value)}
        />
        <div className="flex justify-end gap-2">
          <button 
            disabled={isSaving}
            onClick={() => { setIsEditing(false); setEditedText(transcript.text); }} 
            className="text-[10px] font-black uppercase px-3 py-1.5 rounded-lg border border-outline-variant/20 hover:bg-surface-container"
          >
            Cancel
          </button>
          <button 
            disabled={isSaving}
            onClick={handleSave} 
            className="text-[10px] font-black uppercase px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-primary/90 shadow-sm"
          >
            {isSaving ? "Saving..." : "Save Correction"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative">
      <p className={`leading-relaxed text-sm ${transcript.correctedText ? "text-primary" : "text-on-secondary-fixed"} print:text-black print:text-base`}>
        &quot;{editedText}&quot;
      </p>
      <button 
        onClick={() => setIsEditing(true)}
        className="absolute top-0 right-0 p-1 text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity hover:text-primary print:hidden"
        title="Edit transcript"
      >
        <span className="material-symbols-outlined text-[18px]">edit_note</span>
      </button>
      {transcript.correctedText && (
        <span className="inline-flex items-center gap-1 text-[9px] font-black text-primary/50 uppercase tracking-tighter mt-1 print:text-gray-500">
          <span className="material-symbols-outlined text-[10px]">verified</span>
          Manually Corrected
        </span>
      )}
    </div>
  );
};

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
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setSession(data.session);
        
        // Load existing decision if any
        if (data.session.recruiterDecision) {
          const d = data.session.recruiterDecision.decision;
          setDecision(
            d === "MOVE_FORWARD" ? "Move Forward" : 
            d === "HOLD" ? "Hold" : 
            d === "DECLINE" ? "Decline" : 
            d === "NEEDS_REVIEW" ? "Needs Review" : 
            null
          );
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

  const handleRequestRetry = async (questionId: string) => {
    if (!confirm("Are you sure you want to request a retry for this answer? This will re-open the candidate session.")) return;

    try {
      const res = await fetch(`/api/recruiter/interviews/${sessionId}/retry-question`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId }),
      });
      if (res.ok) {
        alert("Retry requested! Candidate can now re-record this answer.");
        // Refresh local state to show updated status if needed
        window.location.reload();
      } else {
        alert("Failed to request retry.");
      }
    } catch (error) {
      console.error(error);
      alert("Error requesting retry.");
    }
  };

  const handleFlagForCalibration = async (answer: any) => {
    if (!confirm("Flag this answer for calibration review? This will send the transcript and current AI scores to the quality dashboard.")) return;

    try {
      const res = await fetch("/api/admin/calibration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: answer.questionId,
          transcript: answer.transcript.text,
          communicationClarity: answer.evaluation.communicationClarity,
          conceptExplanation: answer.evaluation.conceptExplanation,
          empathyAndPatience: answer.evaluation.empathyAndPatience,
          adaptability: answer.evaluation.adaptability,
          professionalism: answer.evaluation.professionalism,
          englishFluency: answer.evaluation.englishFluency,
          reasoning: "Flagged by recruiter for quality review."
        }),
      });

      if (res.ok) {
        alert("Successfully flagged for calibration!");
      } else {
        alert("Failed to flag for calibration.");
      }
    } catch (error) {
      console.error(error);
      alert("Error flagging for calibration.");
    }
  };

  const handleUpdateTranscript = async (transcriptId: string, text: string) => {
    try {
      const res = await fetch(`/api/transcripts/${transcriptId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      
      if (res.ok) {
        // Update local state
        setSession((prev: any) => ({
          ...prev,
          answers: prev.answers.map((ans: any) => 
            ans.transcript?.id === transcriptId 
              ? { ...ans, transcript: { ...ans.transcript, text, correctedText: text } }
              : ans
          )
        }));
        return true;
      } else {
        return false;
      }
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  if (loading || (session?.status === "FINALIZING" && !session?.finalReport)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin w-10 h-10 text-primary" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <p className="text-on-surface-variant font-medium">
            {session?.status === "FINALIZING" ? "AI is generating the final report..." : "Loading report data..."}
          </p>
          {session?.status === "FINALIZING" && (
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-surface-container-high text-primary rounded-lg text-sm font-bold"
            >
              Refresh Status
            </button>
          )}
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
    <div className="min-h-screen bg-background print:bg-white">
      <Header />

      <div id="report-content" className="max-w-[1920px] mx-auto p-6 md:p-8 lg:p-12 print:p-0 print:max-w-none">
        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 md:mb-12 print:mb-8 print:border-b print:pb-6">
          <div>
            <nav className="flex gap-2 items-center mb-4 text-on-surface-variant print:hidden">
              <Link href="/recruiter" className="text-[10px] font-bold uppercase tracking-widest hover:text-primary transition-colors">Candidates</Link>
              <span className="material-symbols-outlined text-sm">chevron_right</span>
              <span className="text-[10px] font-bold uppercase tracking-widest">Technical Interview</span>
            </nav>
            <div className="hidden print:block mb-4">
              <span className="text-xl font-black text-primary tracking-tighter">Cuemath AI Assessment</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-on-secondary-fixed mb-2 print:text-3xl print:text-black">{CANDIDATE_DATA.name}&apos;s Analysis</h1>
            <p className="text-on-surface-variant text-base md:text-lg max-w-xl print:text-sm print:text-gray-600">AI-generated evaluation report for screening.</p>
          </div>
          <div className="flex gap-3 flex-shrink-0 print:hidden">
            <button 
              onClick={() => exportToPDF("report-content", `${CANDIDATE_DATA.name.replace(/\s+/g, "_")}_AI_Report.pdf`)} 
              className="px-5 py-3 rounded-xl bg-surface-container-high text-primary font-bold text-sm flex items-center gap-2 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span><span className="hidden sm:inline">Export PDF</span>
            </button>            <button 
              onClick={async () => {
                const text = `Cuemath AI Report for ${CANDIDATE_DATA.name}\nScore: ${CANDIDATE_DATA.matchScore}%\nRecommendation: ${CANDIDATE_DATA.recommendation}\nURL: ${window.location.href}`;
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print:flex print:flex-col">
          {/* Score */}
          <div className="lg:col-span-4 bg-surface-container-lowest p-8 rounded-xl shadow-[0_4px_20px_rgba(73,95,132,0.04)] flex flex-col justify-between items-center text-center print:shadow-none print:border print:p-6 print:mb-6">
            <div className="mb-6 w-full">
              <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block mb-8 print:mb-4">Overall Match Score</span>
              <div className="relative w-48 h-48 flex items-center justify-center mx-auto print:w-32 print:h-32">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 192 192">
                  <circle cx="96" cy="96" r="88" fill="transparent" stroke="currentColor" strokeWidth="12" className="text-surface-container-low print:text-gray-100" />
                  <circle cx="96" cy="96" r="88" fill="transparent" stroke="currentColor" strokeWidth="12" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="text-primary-container transition-all duration-1000 print:text-primary" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-black text-on-secondary-fixed print:text-3xl">{CANDIDATE_DATA.matchScore}%</span>
                  <span className="text-xs font-bold text-tertiary">{CANDIDATE_DATA.matchScore >= 80 ? 'EXCEPTIONAL' : CANDIDATE_DATA.matchScore >= 60 ? 'STRONG' : 'NEEDS REVIEW'}</span>
                </div>
              </div>
            </div>
            <div className="w-full pt-6 border-t border-outline-variant/20 print:pt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-on-surface-variant">AI Confidence</span>
                <span className="text-sm font-bold text-on-secondary-fixed">{CANDIDATE_DATA.confidence >= 80 ? 'High' : 'Moderate'} ({CANDIDATE_DATA.confidence}%)</span>
              </div>
              <div className="w-full h-2 bg-surface-container-low rounded-full overflow-hidden print:bg-gray-100">
                <div className="h-full bg-tertiary-container print:bg-gray-400" style={{ width: `${CANDIDATE_DATA.confidence}%` }} />
              </div>
            </div>
          </div>
          {/* Strengths & Risks */}
          <div className="lg:col-span-8 bg-surface-container-lowest p-6 md:p-8 rounded-xl shadow-[0_4px_20px_rgba(73,95,132,0.04)] print:shadow-none print:border print:p-6 print:mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 print:gap-8">
              <div>
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-on-secondary-fixed print:mb-4 print:text-lg">
                  <span className="material-symbols-outlined text-tertiary print:hidden">check_circle</span>Key Strengths
                </h3>
                <ul className="space-y-4">
                  {session.finalReport?.strengths.map((s: string, i: number) => (
                    <li key={i} className="p-4 bg-tertiary/5 rounded-lg border-l-4 border-tertiary print:bg-gray-50 print:border-gray-400 print:p-3">
                      <p className="text-xs text-on-surface-variant font-medium leading-relaxed print:text-black">{s}</p>
                    </li>
                  )) || <li className="text-xs text-on-surface-variant italic">No specific strengths highlighted.</li>}
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-on-secondary-fixed print:mb-4 print:text-lg">
                  <span className="material-symbols-outlined text-error print:hidden">warning</span>Identified Risks
                </h3>
                <ul className="space-y-4">
                  {session.finalReport?.risks.map((r: string, i: number) => (
                    <li key={i} className="p-4 bg-error/5 rounded-lg border-l-4 border-error print:bg-gray-50 print:border-gray-400 print:p-3">
                      <p className="text-xs text-on-surface-variant font-medium leading-relaxed print:text-black">{r}</p>
                    </li>
                  )) || <li className="text-xs text-on-surface-variant italic">No major risks identified.</li>}
                </ul>
              </div>
            </div>
          </div>

          {/* Full Conversation Transcript View */}
          <div className="lg:col-span-12 bg-surface-container-lowest p-6 md:p-10 rounded-xl shadow-[0_4px_20px_rgba(73,95,132,0.04)]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
              <div>
                <h3 className="text-2xl font-black text-on-secondary-fixed">Full Transcription View</h3>
                <p className="text-xs text-on-surface-variant font-medium mt-1 uppercase tracking-widest">Chronological interview flow</p>
              </div>
              <button 
                onClick={() => {
                  const fullText = session.answers.map((a: any, i: number) => `Q${i+1}: ${a.question?.prompt || a.question}\nA: ${a.transcript?.text || '...'}`).join('\n\n');
                  navigator.clipboard.writeText(fullText);
                  alert("Full transcript copied to clipboard!");
                }}
                className="px-4 py-2 rounded-lg bg-surface-container-high text-primary font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-surface-container-highest transition-all no-print"
              >
                <span className="material-symbols-outlined text-sm">content_copy</span>
                Copy Full Transcript
              </button>
            </div>

            <div className="max-w-4xl mx-auto space-y-8">
              {session.answers.map((answer: any, idx: number) => (
                <div key={`flow-${answer.id}`} className="group relative pl-8 border-l-2 border-outline-variant/30 hover:border-primary/40 transition-colors">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-surface-container border-2 border-outline-variant/50 group-hover:border-primary/50 transition-colors" />
                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-primary/60 uppercase tracking-tighter">Question {idx + 1}</p>
                    <p className="text-on-surface font-bold text-base leading-snug">
                      {answer.question?.prompt || answer.question}
                    </p>
                    <div className="bg-surface-container-low/50 p-4 rounded-xl border border-transparent group-hover:border-outline-variant/10 group-hover:bg-white transition-all">
                      <p className="text-on-secondary-fixed leading-relaxed text-sm italic">
                        &quot;{answer.transcript?.text || "Transcribing..."}&quot;
                      </p>
                      {answer.transcript?.correctedText && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-black text-tertiary uppercase tracking-tighter mt-2">
                          <span className="material-symbols-outlined text-[10px]">edit_square</span>
                          Verified Correction
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Question History */}
          <div className="lg:col-span-9 bg-surface-container-lowest p-6 md:p-8 rounded-xl shadow-[0_4px_20px_rgba(73,95,132,0.04)] space-y-8 print:shadow-none print:border print:p-6 print:w-full print:mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h3 className="text-2xl font-black text-on-secondary-fixed print:text-xl">Interview Evidence</h3>
              <div className="flex gap-2 flex-wrap print:hidden">
                <span className="px-3 py-1 bg-surface-container text-[10px] font-bold rounded-full text-on-surface-variant uppercase">Transcript Ready</span>
                <span className="px-3 py-1 bg-surface-container text-[10px] font-bold rounded-full text-on-surface-variant uppercase">Voice Authenticated</span>
              </div>
            </div>

            {/* Transcript & Audio */}
            <div className="space-y-10 print:space-y-8">
              {session.answers.map((answer: any, idx: number) => (
                <div key={answer.id} className="space-y-6 pb-10 border-b border-outline-variant/10 last:border-0 last:pb-0 interview-evidence-item print:pb-6 print:break-inside-avoid">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center flex-shrink-0 print:border print:bg-white">
                      <span className="material-symbols-outlined text-secondary">smart_toy</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-tight print:text-gray-500">Question {idx + 1}</p>
                      <p className="text-on-surface leading-relaxed font-bold italic print:text-black print:text-base">&quot;{answer.question?.prompt || answer.question || `Question ${idx + 1}`}&quot;</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary-container/20 flex items-center justify-center flex-shrink-0 text-primary font-bold text-sm print:border print:bg-white print:text-black">
                      {CANDIDATE_DATA.initials}
                    </div>
                    <div className="bg-surface-container-low p-5 rounded-xl flex-1 min-w-0 print:bg-white print:border print:p-4">
                      <div className="flex justify-between items-start mb-4">
                        <p className="text-xs font-bold text-on-surface-variant uppercase tracking-tight print:text-gray-500">
                          Candidate Response • {new Date(answer.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleFlagForCalibration(answer)}
                            className="text-[10px] font-black uppercase px-2 py-1 rounded bg-secondary/10 text-secondary hover:bg-secondary hover:text-white transition-colors print:hidden"
                            title="Flag for calibration review"
                          >
                            Flag for Quality
                          </button>
                          <button 
                            onClick={() => handleRequestRetry(answer.questionId)}
                            className={`text-[10px] font-black uppercase px-2 py-1 rounded transition-colors ${answer.status === "NEEDS_RETRY" ? "bg-error/10 text-error" : "bg-primary/10 text-primary hover:bg-primary hover:text-white"} print:hidden`}
                          >
                            {answer.status === "NEEDS_RETRY" ? "Retry Requested" : "Request Retry"}
                          </button>
                        </div>
                      </div>
                      
                      <div className="mb-4 waveform-container print:hidden">
                        <Waveform audioUrl={answer.audioObjectKey} />
                      </div>
                      <div className="hidden print:block mb-2 text-[10px] text-gray-400 font-mono italic">
                        [Audio Content Available in Digital Report]
                      </div>
                      
                      {answer.transcript ? (
                        <TranscriptEditor 
                          transcript={answer.transcript} 
                          onSave={handleUpdateTranscript} 
                        />
                      ) : (
                        <p className="text-on-secondary-fixed italic leading-relaxed text-sm animate-pulse print:animate-none">
                          Processing transcript...
                        </p>
                      )}
                      
                      {answer.evaluation?.evidence && (
                        <div className="mt-4 flex gap-2 flex-wrap">
                          {answer.evaluation.evidence.map((tag: string) => (
                            <span key={tag} className="px-2 py-1 bg-tertiary/10 text-tertiary text-[10px] font-bold rounded uppercase tracking-tighter print:bg-gray-100 print:text-gray-700 print:border">{tag}</span>
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
          <div className="lg:col-span-3 space-y-6 print:hidden">
            <div className="lg:sticky lg:top-24 space-y-6">
              <div className="bg-on-secondary-fixed p-6 md:p-8 rounded-xl text-white shadow-xl">
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
                  <button onClick={() => setDecision("Needs Review")} className={`w-full py-4 font-bold rounded-xl transition-all text-sm border ${decision === "Needs Review" ? "bg-tertiary/20 text-tertiary border-tertiary/20" : "bg-white/10 hover:bg-white/20 text-white border-white/10"}`}>
                    Needs Human Review
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

              <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10">
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

              <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10">
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

          {/* Print-only Info Section */}
          <div className="hidden print:block mt-10 pt-8 border-t border-gray-200">
            <h4 className="font-bold text-lg mb-4">Assessment Information</h4>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Candidate Email</p>
                <p className="text-sm font-medium">{CANDIDATE_DATA.email}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Screening Date</p>
                <p className="text-sm font-medium">{CANDIDATE_DATA.screenedOn}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Recommendation</p>
                <p className="text-sm font-bold">{CANDIDATE_DATA.recommendation}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Report Generated By</p>
                <p className="text-sm font-medium">Cuemath AI Assessment Engine</p>
              </div>
            </div>
            
            <div className="mt-12 pt-6 border-t border-gray-100 flex justify-between items-center text-[10px] text-gray-400 font-medium">
              <span>© {new Date().getFullYear()} Cuemath. Private and Confidential.</span>
              <span>Ref: {sessionId}</span>
            </div>
          </div>
        </div>
      </div>

      <button className="fixed bottom-6 right-6 w-14 h-14 premium-gradient text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-90 transition-all z-50 lg:hidden print:hidden">
        <span className="material-symbols-outlined text-2xl">send</span>
      </button>
    </div>
  );
}
