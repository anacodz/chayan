"use client";

import { Question } from "@/lib/questions";
import CuemathLogo from "../CuemathLogo";

interface InterviewProps {
  questionIndex: number;
  totalQuestions: number;
  currentQuestion: Question | { id: string; prompt: string; guidance?: string; competencyTags?: string[] };
  status: "idle" | "recording" | "processing" | "error" | "needs_retry";
  elapsed: number; // This is now timeLeft from parent
  maxSeconds: number;
  processingStep: string;
  processingProgress: number;
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
  processingStep,
  processingProgress,
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
      <div className="absolute inset-y-0 right-0 w-[35%] bg-[#f0f4f8]/70 pointer-events-none hidden lg:block" />
      <header className="glass-header sticky top-0 z-50 shadow-[0_4px_20px_rgba(0,46,110,0.04)] border-b border-outline-variant/10">
        <div className="flex justify-between items-center w-full px-6 md:px-8 py-4 max-w-[1920px] mx-auto">
          <div className="flex items-center gap-4">
            <CuemathLogo className="w-8 h-8" />
            <span className="text-xl font-black tracking-tight text-primary leading-none">Cuemath</span>
            <div className="w-px h-4 bg-outline-variant/30 hidden sm:block mx-2" />
            <div className="flex items-center gap-2 px-3 py-1 bg-error/10 text-error rounded-full animate-pulse">
              <span className="material-symbols-outlined text-sm">lock</span>
              <span className="text-[10px] font-black uppercase tracking-widest">Secure Mode</span>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Total Time Remaining</span>
              <span className={`text-xl font-black tabular-nums ${elapsed < 60 ? 'text-error' : 'text-on-secondary-fixed'}`}>
                {formatTime(elapsed)}
              </span>
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
          Question {questionIndex + 1} of {totalQuestions} • {progress}%
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
                  <div className="flex items-end gap-[3px] h-16 w-full justify-center mb-4">
                    {waveform.map((h, i) => (
                      <div 
                        key={i} 
                        className="w-1.5 bg-primary rounded-full transition-all duration-75" 
                        style={{ height: `${h}px` }} 
                      />
                    ))}
                  </div>
                  <p className="text-xs text-on-surface-variant font-medium">Capturing your voice response...</p>
                </>
              ) : status === "needs_retry" ? (
                <div className="flex flex-col items-center gap-4 py-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-error-container/50 flex items-center justify-center text-error">
                    <span className="material-symbols-outlined text-3xl">replay</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-on-surface">Please try again</p>
                    <p className="text-xs text-on-surface-variant max-w-[240px] mt-2 mx-auto leading-relaxed">{error || "We couldn't clearly hear your response. Please re-record your answer."}</p>
                  </div>
                </div>
              ) : status === "processing" ? (
                <div className="flex flex-col items-center gap-6 py-4 w-full text-center">
                  <div className="relative w-20 h-20 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="45" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-surface-container-high" />
                      <circle cx="50" cy="50" r="45" fill="transparent" stroke="currentColor" strokeWidth="8" strokeDasharray={2 * Math.PI * 45} strokeDashoffset={2 * Math.PI * 45 * (1 - processingProgress / 100)} strokeLinecap="round" className="text-primary transition-all duration-500" />
                    </svg>
                    <span className="absolute text-sm font-black text-primary">{processingProgress}%</span>
                  </div>
                  <div className="space-y-2 w-full px-4">
                    <p className="text-sm font-bold text-on-surface">{processingStep}</p>
                    <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                      <div className="h-full bg-primary transition-all duration-500" style={{ width: `${processingProgress}%` }} />
                    </div>
                  </div>
                  <div className="flex justify-between w-full px-8 mt-2">
                    <div className={`flex flex-col items-center gap-1 ${processingProgress >= 25 ? 'text-primary' : 'text-on-surface-variant/30'}`}>
                      <span className="material-symbols-outlined text-sm">{processingProgress >= 25 ? 'check_circle' : 'upload'}</span>
                      <span className="text-[8px] font-bold uppercase">Upload</span>
                    </div>
                    <div className={`flex flex-col items-center gap-1 ${processingProgress >= 75 ? 'text-primary' : 'text-on-surface-variant/30'}`}>
                      <span className="material-symbols-outlined text-sm">{processingProgress >= 75 ? 'check_circle' : 'text_fields'}</span>
                      <span className="text-[8px] font-bold uppercase">Transcribe</span>
                    </div>
                    <div className={`flex flex-col items-center gap-1 ${processingProgress >= 100 ? 'text-primary' : 'text-on-surface-variant/30'}`}>
                      <span className="material-symbols-outlined text-sm">{processingProgress >= 100 ? 'check_circle' : 'psychology'}</span>
                      <span className="text-[8px] font-bold uppercase">Evaluate</span>
                    </div>
                  </div>
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
              ) : (status === "idle" || status === "error" || status === "needs_retry") ? (
                <button 
                  onClick={onStartRecording} 
                  className="w-full sm:w-auto px-8 sm:px-12 py-4 sm:py-5 premium-gradient rounded-2xl text-white font-bold text-base sm:text-lg shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined">mic</span> {status === "error" || status === "needs_retry" ? "Try Again" : "Start Recording"}
                </button>
              ) : null}
            </div>
            
            {error && status !== "needs_retry" && (
              <div className="mt-6 bg-error-container text-on-error-container text-sm rounded-xl px-4 py-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">error</span>
                {error}
              </div>
            )}

            <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-outline-variant/10">
              <h3 className="text-[10px] font-black tracking-widest uppercase text-error mb-3 flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">warning</span>
                Security Warning
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed mb-3">
                Do not switch tabs or exit fullscreen. Doing so will immediately invalidate your assessment session.
              </p>
              <h3 className="text-[10px] font-black tracking-widest uppercase text-on-surface-variant mb-2">Speaking Tips</h3>
              <ul className="space-y-2 text-xs text-on-surface-variant leading-relaxed">
                <li className="flex gap-2"><span className="text-primary">•</span>Be clear and concise.</li>
                <li className="flex gap-2"><span className="text-primary">•</span>Explain concepts as if to a student.</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
