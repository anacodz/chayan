"use client";

import { useMemo } from "react";

interface InterviewProps {
  questionIndex: number;
  totalQuestions: number;
  currentQuestion: {
    id: string;
    prompt: string;
    guidance?: string;
  };
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
  session?: any;
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
}: InterviewProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="glass-header sticky top-0 z-50 shadow-[0_4px_20px_rgba(73,95,132,0.04)]">
        <div className="flex justify-between items-center w-full px-6 md:px-8 py-4 max-w-[1920px] mx-auto">
          <div className="flex items-center gap-6">
            <span className="text-xl font-black tracking-tighter text-on-secondary-fixed">Chayan</span>
            {session && <span className="text-sm text-on-surface-variant font-medium hidden sm:inline">Candidate: {session.candidate.name}</span>}
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-white text-xs font-bold">
              {session?.candidate.name[0] || "C"}
            </div>
          </div>
        </div>
        <div className="w-full h-1 bg-surface-container-high">
          <div className="h-full bg-primary-container transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-start px-4 md:px-8 pt-8 md:pt-16 pb-28">
        <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-8">
          Question {questionIndex + 1} of {totalQuestions}
        </p>
        
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          <div className="lg:col-span-7">
            <div className="bg-surface-container-lowest rounded-2xl p-8 md:p-10 shadow-sm min-h-[240px] flex flex-col justify-center">
              <h2 className="text-2xl md:text-3xl font-bold text-on-surface leading-snug mb-4">
                &ldquo;{currentQuestion.prompt}&rdquo;
              </h2>
              {currentQuestion.guidance && (
                <p className="text-sm text-on-surface-variant leading-relaxed flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[18px]">lightbulb</span>
                  {currentQuestion.guidance}
                </p>
              )}
            </div>
          </div>

          <div className="lg:col-span-5 space-y-4">
            <div className="bg-surface-container-lowest rounded-2xl p-8 shadow-sm flex flex-col items-center">
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

            <div className="mt-8 flex justify-center">
              {status === "recording" ? (
                <button 
                  onClick={onStopRecording} 
                  className="px-12 py-5 premium-gradient rounded-2xl text-white font-bold text-lg shadow-xl flex items-center gap-3 active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined">stop</span> Stop Recording
                </button>
              ) : status === "idle" ? (
                <button 
                  onClick={onStartRecording} 
                  className="px-12 py-5 premium-gradient rounded-2xl text-white font-bold text-lg shadow-xl flex items-center gap-3 active:scale-95 transition-all"
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
          </div>
        </div>
      </main>
    </div>
  );
}
