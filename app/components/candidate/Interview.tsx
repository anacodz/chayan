"use client";

import { Question } from "@/lib/questions";
import CuemathLogo from "../CuemathLogo";

interface InterviewProps {
  questionIndex: number;
  totalQuestions: number;
  currentQuestion: Question | { id: string; prompt: string; guidance?: string; competencyTags?: string[] };
  status: "idle" | "recording" | "processing" | "error";
  elapsed: number;
  maxSeconds: number;
  processingStep: string;
  error: string;
  waveform: number[];
  onStartRecording: () => void;
  onStopRecording: () => void;
  formatTime: (s: number) => string;
  progress: number;
  session?: {
    candidate: {
      name: string;
    };
  };
  onPlayTts: () => void;
  isTtsLoading: boolean;
}

export default function Interview({
  questionIndex,
  totalQuestions,
  currentQuestion,
  status,
  elapsed,
  maxSeconds,
  processingStep,
  error,
  waveform,
  onStartRecording,
  onStopRecording,
  formatTime,
  progress,
  session,
  onPlayTts,
  isTtsLoading,
}: InterviewProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      <div className="absolute inset-y-0 right-0 w-[38%] bg-[#f6f2e8]/40 pointer-events-none hidden lg:block" />
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary-fixed/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-secondary-fixed/10 rounded-full blur-3xl"></div>
      </div>
      <header className="glass-header sticky top-0 z-50 shadow-[0_4px_20px_rgba(0,46,110,0.04)] border-b border-outline-variant/10">
        <div className="flex justify-between items-center w-full px-6 md:px-8 py-4 max-w-[1920px] mx-auto">
          <div className="flex items-center gap-4">
            <CuemathLogo className="w-8 h-8" />
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black tracking-tight text-primary leading-none">Cuemath</span>
              <span className="text-[10px] font-bold text-on-surface-variant/30 tracking-tight lowercase">chayan</span>
            </div>
            <div className="w-px h-4 bg-outline-variant/30 hidden sm:block mx-1" />
            {session && <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest hidden sm:inline">Certified Assessment</span>}
          </div>
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-full bg-secondary/10 border border-secondary/20 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
              <span className="text-[10px] font-bold text-secondary uppercase tracking-tighter">Live Session</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold shadow-sm">
              {session?.candidate.name[0] || "C"}
            </div>
          </div>
        </div>
        <div className="w-full h-1 bg-surface-container-high">
          <div className="h-full bg-primary transition-all duration-500 shadow-[0_0_8px_rgba(0,112,255,0.4)]" style={{ width: `${progress}%` }} />
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-start px-4 md:px-8 pt-8 md:pt-16 pb-28 md:pb-20 relative z-10">
        <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-8">
          Question {questionIndex + 1} of {totalQuestions}
        </p>
        
        <div className="w-full max-w-[1120px] grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 lg:gap-8">
          <div className="lg:col-span-7">
            <div className="bg-surface-container-lowest rounded-2xl p-6 sm:p-8 md:p-10 shadow-sm min-h-[220px] md:min-h-[240px] flex flex-col justify-center">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-on-surface leading-snug">
                  &ldquo;{currentQuestion.prompt}&rdquo;
                </h2>
                <button 
                  onClick={onPlayTts}
                  disabled={isTtsLoading}
                  className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    isTtsLoading ? "bg-surface-container-high animate-pulse" : "bg-primary/10 text-primary hover:bg-primary/20"
                  }`}
                  title="Listen to question"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {isTtsLoading ? "more_horiz" : "volume_up"}
                  </span>
                </button>
              </div>
              {currentQuestion.guidance && (
                <p className="text-sm text-on-surface-variant leading-relaxed flex items-start gap-2">
                  <span className="material-symbols-outlined text-primary text-[18px]">lightbulb</span>
                  {currentQuestion.guidance}
                </p>
              )}
            </div>
          </div>

          <div className="lg:col-span-5 space-y-4">
            <div className="bg-surface-container-lowest rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col items-center">
              {status === "recording" ? (
                <>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="recording-dot" />
                    <span className="text-sm font-bold text-error uppercase tracking-widest">Recording</span>
                  </div>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-5xl font-black text-on-surface tabular-nums">{formatTime(elapsed)}</span>
                    <span className="text-xl text-on-surface-variant font-medium">/ {formatTime(maxSeconds)}</span>
                  </div>
                  <div className="flex items-end gap-[3px] h-12 w-full justify-center">
                    {waveform.map((h, i) => (
                      <div 
                        key={i} 
                        className="w-1.5 bg-primary rounded-full transition-all duration-75" 
                        style={{ height: `${h}px` }} 
                      />
                    ))}
                  </div>
                </>
              ) : status === "processing" ? (
                <div className="flex flex-col items-center gap-4 py-8 text-center">
                  <svg className="animate-spin w-10 h-10 text-primary" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  <p className="text-sm font-bold text-on-surface">{processingStep}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 py-8">
                  <div className="w-16 h-16 rounded-full bg-surface-container-low flex items-center justify-center">
                    <span className="material-symbols-outlined text-3xl text-on-surface-variant">mic</span>
                  </div>
                  <p className="text-sm font-bold text-on-surface">Ready to record</p>
                </div>
              )}
            </div>

            <div className="mt-6 sm:mt-8 flex justify-center">
              {status === "recording" ? (
                <button 
                  onClick={onStopRecording} 
                  className="w-full sm:w-auto px-8 sm:px-12 py-4 sm:py-5 premium-gradient rounded-2xl text-white font-bold text-base sm:text-lg shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined">stop</span> Stop Recording
                </button>
              ) : status === "idle" ? (
                <button 
                  onClick={onStartRecording} 
                  className="w-full sm:w-auto px-8 sm:px-12 py-4 sm:py-5 premium-gradient rounded-2xl text-white font-bold text-base sm:text-lg shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined">mic</span> Start Recording
                </button>
              ) : null}
            </div>
            
            {error && (
              <div className="mt-6 bg-error-container text-on-error-container text-sm rounded-xl px-4 py-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">error</span>
                {error}
              </div>
            )}

            <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-outline-variant/10">
              <h3 className="text-xs font-bold tracking-widest uppercase text-on-surface-variant mb-3">Speaking Tips</h3>
              <ul className="space-y-2.5 text-sm text-on-surface-variant leading-relaxed">
                <li className="flex gap-2"><span className="text-primary">•</span>Use concrete classroom examples when possible.</li>
                <li className="flex gap-2"><span className="text-primary">•</span>Keep your answer structured: context, approach, result.</li>
                <li className="flex gap-2"><span className="text-primary">•</span>If stuck, pause briefly and continue clearly.</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      <div className="absolute bottom-12 left-12 hidden lg:flex items-center gap-4">
        <div className="flex -space-x-3">
          <img className="w-10 h-10 rounded-full border-2 border-background object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBplEnez1pBV0osV1A0_LUKWhV1ncjPcGp5iKIyJP4BxLaAlPY8Gg_VJSlIno4Y-Kmxdph-tyhwuM0e4ZsIinfrG89aKklecPsS6EX4rWWVX2y8t8e8D4xJsh1Q6zPYlA1Dl3WbE_3SXk8sYSOeDbszHHgujKnfemvRiTnUU8PDpgkhD_DIVudgWkClQjCgqHTPeliEY6KxzyibGlSwfSO8tUd7N9sRINZdqZgGu1z2SVcIho_gexcYcEKSmOQNOB4obgAxxyAtSjMN" alt="Tutor" />
          <img className="w-10 h-10 rounded-full border-2 border-background object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDjUvJa4dxzzg2ZjJPte_5S-C8mF8XKgqYN50pm5Bmh7oIvk5ZCemiejOQArUmfnN3hlpsiOBrrczHhE_q2uMQJhHDLaACcBO41hCaEKJTK4lEWaz3iObVsdXuLzGSMY0Aroj8vSaUNCbgNXkVx6_vkm2bb1Jy-54tLG2aZV5gnDBr9FwkowX93vobt_lNtE9yptKTZCZuTUZ-BaCYODFaRZFgjQS_4-WGCIpH6VvHVKkcYnGtRfWQAb0jCb1D9udMW4AEzO1jVyVnS" alt="Tutor" />
          <div className="w-10 h-10 rounded-full border-2 border-background bg-secondary flex items-center justify-center text-[10px] font-bold text-white">
            +2k
          </div>
        </div>
        <p className="text-xs font-medium text-on-surface-variant">Join 2,000+ expert educators curated by Cuemath.</p>
      </div>
    </div>
  );
}
