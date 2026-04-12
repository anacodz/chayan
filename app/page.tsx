"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { questions } from "@/lib/questions";
import type { AnswerEvaluation, FinalReport } from "@/lib/types";

type Answer = {
  questionId: string;
  question: string;
  transcript: string;
  evaluation: AnswerEvaluation;
};

type Phase = "loading" | "invalid" | "consent" | "interview" | "complete";
type RecordStatus = "idle" | "recording" | "processing" | "error";

export default function Home() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [session, setSession] = useState<any>(null);
  const [consented, setConsented] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [status, setStatus] = useState<RecordStatus>("idle");
  const [processingStep, setProcessingStep] = useState<string>("");
  const [error, setError] = useState("");
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [report, setReport] = useState<FinalReport | null>(null);
  const [transcriptDraft, setTranscriptDraft] = useState("");
  
  const [followUpQuestion, setFollowUpQuestion] = useState<string | null>(null);
  const [hasAskedFollowUp, setHasAskedFollowUp] = useState(false);

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  /* Timer state */
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const MAX_SECONDS = 180; // 3 minutes

  /* Waveform bars */
  const [waveform, setWaveform] = useState<number[]>(Array(20).fill(4));
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const currentQuestion = useMemo(() => {
    if (followUpQuestion) {
      return { 
        id: `follow-up-${questions[questionIndex].id}`, 
        prompt: followUpQuestion, 
        competencyTags: questions[questionIndex].competencyTags 
      };
    }
    return questions[questionIndex];
  }, [questionIndex, followUpQuestion]);

  const progress = useMemo(
    () => Math.round(((questionIndex) / questions.length) * 100),
    [questionIndex]
  );

  /* Validate Invite on Mount */
  useEffect(() => {
    async function validate() {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get("invite");

      if (!token) {
        setPhase("consent");
        return;
      }

      try {
        const res = await fetch(`/api/invites/${token}`);
        if (!res.ok) {
          setPhase("invalid");
          return;
        }
        const data = await res.json();
        setSession(data.session);
        setPhase("consent");
      } catch {
        setPhase("invalid");
      }
    }
    validate();
  }, []);

  const formatTime = useCallback((s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }, []);

  /* Start / stop timer */
  useEffect(() => {
    if (status === "recording") {
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((p) => p + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [status]);

  /* Waveform animation */
  useEffect(() => {
    if (status === "recording" && analyserRef.current) {
      const analyser = analyserRef.current;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(dataArray);
        const bars: number[] = [];
        const sliceWidth = Math.floor(dataArray.length / 20);
        for (let i = 0; i < 20; i++) {
          let sum = 0;
          for (let j = 0; j < sliceWidth; j++) {
            sum += dataArray[i * sliceWidth + j];
          }
          const avg = sum / sliceWidth;
          bars.push(Math.max(4, (avg / 255) * 40));
        }
        setWaveform(bars);
        animFrameRef.current = requestAnimationFrame(tick);
      };
      tick();
    } else {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (status !== "recording") setWaveform(Array(20).fill(4));
    }
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, [status]);

  /* ── Recording logic ──────────────────────────────────────── */
  async function startRecording() {
    setError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Your browser doesn't support recording. Please upload an audio file instead.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunks.current = [];

      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const recorder = new MediaRecorder(stream);
      mediaRecorder.current = recorder;
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunks.current.push(e.data); };
      recorder.onstop = () => stream.getTracks().forEach((t) => t.stop());
      recorder.start();
      setStatus("recording");
    } catch {
      setError("Microphone access was blocked. Please enable it in your browser settings or upload an audio file.");
    }
  }

  async function stopAndSubmit() {
    const recorder = mediaRecorder.current;
    if (!recorder || recorder.state === "inactive") return;
    await new Promise<void>((resolve) => {
      recorder.addEventListener("stop", () => resolve(), { once: true });
      recorder.stop();
    });
    const audio = new Blob(audioChunks.current, { type: recorder.mimeType || "audio/webm" });
    await processAudio(audio);
  }

  async function handleReRecord() {
    const recorder = mediaRecorder.current;
    if (recorder && recorder.state !== "inactive") {
      await new Promise<void>((resolve) => {
        recorder.addEventListener("stop", () => resolve(), { once: true });
        recorder.stop();
      });
    }
    audioChunks.current = [];
    setStatus("idle");
    setElapsed(0);
    setTranscriptDraft("");
  }

  async function handleUpload(file: File | null) {
    if (!file) return;
    setError("");
    await processAudio(file);
  }

  async function processAudio(audio: Blob) {
    if (!currentQuestion) return;
    setStatus("processing");
    setProcessingStep("Uploading your answer...");
    setTranscriptDraft("");
    try {
      const form = new FormData();
      form.append("audio", audio, "answer.webm");
      form.append("sessionId", session?.id || "demo");
      form.append("questionId", currentQuestion.id);
      form.append("question", currentQuestion.prompt);
      form.append("competencyTags", JSON.stringify(currentQuestion.competencyTags));

      const uploadRes = await fetch("/api/answers/upload", { method: "POST", body: form });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || "Upload failed.");
      
      const answerId = uploadData.answerId;
      setProcessingStep("Transcribing and evaluating...");

      let attempts = 0;
      const MAX_ATTEMPTS = 60;
      let evaluation: AnswerEvaluation | null = null;
      let transcript = "";

      while (attempts < MAX_ATTEMPTS) {
        await new Promise(r => setTimeout(r, 2000));
        attempts++;

        const statusRes = await fetch(`/api/answers/${answerId}/status`);
        const statusData = await statusRes.json();
        
        if (statusData.status === "EVALUATED") {
          evaluation = statusData.evaluation;
          transcript = statusData.transcript;
          break;
        } else if (statusData.status === "FAILED") {
          throw new Error("AI processing failed. Please try again.");
        }
      }

      if (!evaluation) throw new Error("Processing timed out.");

      setTranscriptDraft(transcript);

      const nextAnswers: Answer[] = [
        ...answers,
        { questionId: currentQuestion.id, question: currentQuestion.prompt, transcript, evaluation },
      ];
      setAnswers(nextAnswers);

      if (evaluation.followUpQuestion && !hasAskedFollowUp) {
        setFollowUpQuestion(evaluation.followUpQuestion);
        setHasAskedFollowUp(true);
        setStatus("idle");
        setTranscriptDraft("");
        return;
      }

      setFollowUpQuestion(null);
      setHasAskedFollowUp(false);

      if (questionIndex === questions.length - 1) {
        await buildReport(nextAnswers);
        return;
      }
      setQuestionIndex((i) => i + 1);
      setStatus("idle");
      setTranscriptDraft("");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  async function buildReport(done: Answer[]) {
    const res = await fetch("/api/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers: done, sessionId: session?.id }),
    });
    const payload = await res.json();
    if (!res.ok) throw new Error(payload.error || "Report generation failed.");
    setReport(payload.report as FinalReport);
    setPhase("complete");
  }

  if (phase === "loading") {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
        <svg className="animate-spin w-10 h-10 text-primary mb-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        <p className="text-on-surface-variant font-medium">Validating your invitation...</p>
      </main>
    );
  }

  if (phase === "invalid") {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-background text-center">
        <div className="w-20 h-20 rounded-full bg-error-container flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-4xl text-on-error-container">error</span>
        </div>
        <h1 className="text-3xl font-black text-on-surface mb-2">Invitation Invalid</h1>
        <p className="text-on-surface-variant max-w-md mb-8">
          This invitation link is invalid or has expired. Please contact your recruiter for a new link.
        </p>
        <button onClick={() => window.location.href = "/"} className="px-8 py-3 bg-primary text-white font-bold rounded-xl shadow-lg">Return Home</button>
      </main>
    );
  }

  if (phase === "complete") {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-lg text-center flex flex-col items-center gap-8">
          <div className="w-20 h-20 rounded-full bg-tertiary-container flex items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-on-tertiary-container" style={{ fontVariationSettings: "'FILL' 1" }}>task_alt</span>
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl font-black text-on-secondary-fixed">Screening Complete</h1>
            <p className="text-on-surface-variant text-lg">Thank you for completing your Cuemath tutor screening.</p>
          </div>
          <div className="bg-surface-container-lowest rounded-2xl p-6 w-full text-left space-y-4 shadow-sm">
            <h3 className="font-bold text-on-secondary-fixed flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">schedule</span>
              What happens next
            </h3>
            <ul className="space-y-3 text-sm text-on-surface-variant">
              <li className="flex gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                Our AI has analysed your {answers.length} responses across 6 competency dimensions.
              </li>
              <li className="flex gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                A recruiter from Cuemath will review your screening report.
              </li>
              <li className="flex gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                Expect to hear back within 2–3 business days.
              </li>
            </ul>
          </div>
          <button onClick={() => { window.location.reload(); }} className="text-sm font-medium text-primary hover:underline">← Start over (demo)</button>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="glass-header sticky top-0 z-50 shadow-[0_4px_20px_rgba(73,95,132,0.04)]">
        <div className="flex justify-between items-center w-full px-6 md:px-8 py-4">
          <div className="flex items-center gap-6">
            <span className="text-xl font-black tracking-tighter text-on-secondary-fixed">InterviewAI</span>
            {session && <span className="text-sm text-on-surface-variant font-medium hidden sm:inline">Candidate: {session.candidate.name}</span>}
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-white text-xs font-bold">{session?.candidate.name[0] || "C"}</div>
          </div>
        </div>
        <div className="w-full h-1 bg-surface-container-high">
          <div className="h-full bg-primary-container transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-start px-4 md:px-8 pt-8 md:pt-16 pb-28">
        <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-8">Question {questionIndex + 1} of {questions.length}</p>
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          <div className="lg:col-span-7">
            <div className="bg-surface-container-lowest rounded-2xl p-8 md:p-10 shadow-[0_4px_20px_rgba(73,95,132,0.04)] min-h-[240px] flex flex-col justify-center">
              <h2 className="text-2xl md:text-3xl font-bold text-on-surface leading-snug mb-4">&ldquo;{currentQuestion.prompt}&rdquo;</h2>
              {/* @ts-ignore */}
              {currentQuestion.guidance && (
                <p className="text-sm text-on-surface-variant leading-relaxed flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[18px]">lightbulb</span>
                  {/* @ts-ignore */}
                  {currentQuestion.guidance}
                </p>
              )}
            </div>
          </div>

          <div className="lg:col-span-5 space-y-4">
            <div className="bg-surface-container-lowest rounded-2xl p-8 shadow-[0_4px_20px_rgba(73,95,132,0.04)] flex flex-col items-center">
              {status === "recording" ? (
                <>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="recording-dot" />
                    <span className="text-sm font-bold text-error uppercase tracking-widest">Recording</span>
                  </div>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-5xl font-black text-on-surface tabular-nums">{formatTime(elapsed)}</span>
                    <span className="text-xl text-on-surface-variant font-medium">/ {formatTime(MAX_SECONDS)}</span>
                  </div>
                </>
              ) : status === "processing" ? (
                <div className="flex flex-col items-center gap-4 py-4 text-center">
                  <svg className="animate-spin w-10 h-10 text-primary" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  <p className="text-sm font-bold text-on-surface">{processingStep}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="w-16 h-16 rounded-full bg-surface-container-low flex items-center justify-center">
                    <span className="material-symbols-outlined text-3xl text-on-surface-variant">mic</span>
                  </div>
                  <p className="text-sm font-bold text-on-surface">Ready to record</p>
                </div>
              )}
            </div>

            <div className="mt-8 flex justify-center">
              {status === "recording" ? (
                <button onClick={stopAndSubmit} className="px-12 py-5 premium-gradient rounded-2xl text-white font-bold text-lg shadow-xl flex items-center gap-3">
                  <span className="material-symbols-outlined">stop</span> Stop Recording
                </button>
              ) : status === "idle" ? (
                <button onClick={startRecording} className="px-12 py-5 premium-gradient rounded-2xl text-white font-bold text-lg shadow-xl flex items-center gap-3">
                  <span className="material-symbols-outlined">mic</span> Start Recording
                </button>
              ) : null}
            </div>
            
            {error && <div className="mt-6 bg-error-container text-on-error-container text-sm rounded-xl px-4 py-3">{error}</div>}
          </div>
        </div>
      </main>
    </div>
  );
}
