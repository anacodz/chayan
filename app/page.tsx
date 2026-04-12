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
  const [error, setError] = useState("");
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [report, setReport] = useState<FinalReport | null>(null);
  const [transcriptDraft, setTranscriptDraft] = useState("");
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

  const [followUpQuestion, setFollowUpQuestion] = useState<string | null>(null);
  const [hasAskedFollowUp, setHasAskedFollowUp] = useState(false);

  const currentQuestion = useMemo(() => {
    if (followUpQuestion) {
      return { id: `follow-up-${questions[questionIndex].id}`, prompt: followUpQuestion, competencyTags: questions[questionIndex].competencyTags };
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
        // For development/demo purposes, allow access if no token is provided
        // but mark it as a "demo" session.
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

      /* Set up Web Audio analyser for waveform */
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
    /* Stop current recording without submitting */
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
    setTranscriptDraft("");
    try {
      const form = new FormData();
      form.append("audio", audio, "answer.webm");

      const tRes = await fetch("/api/transcribe", { method: "POST", body: form });
      const tPayload = await tRes.json();
      if (!tRes.ok) throw new Error(tPayload.error || "Transcription failed.");
      const transcript = tPayload.transcript as string;
      setTranscriptDraft(transcript);

      const eRes = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: currentQuestion.prompt, competencyTags: currentQuestion.competencyTags, transcript }),
      });
      const ePayload = await eRes.json();
      if (!eRes.ok) throw new Error(ePayload.error || "Evaluation failed.");

      const evaluation = ePayload.evaluation as AnswerEvaluation;

      const nextAnswers: Answer[] = [
        ...answers,
        { questionId: currentQuestion.id, question: currentQuestion.prompt, transcript, evaluation },
      ];
      setAnswers(nextAnswers);

      // Handle follow-up logic
      if (evaluation.followUpQuestion && !hasAskedFollowUp) {
        setFollowUpQuestion(evaluation.followUpQuestion);
        setHasAskedFollowUp(true);
        setStatus("idle");
        setTranscriptDraft("");
        return;
      }

      // Reset follow-up state for the next base question
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
      body: JSON.stringify({ answers: done }),
    });
    const payload = await res.json();
    if (!res.ok) throw new Error(payload.error || "Report generation failed.");
    setReport(payload.report as FinalReport);
    setPhase("complete");
  }

  /* ── Screen 0: Loading ────────────────────────────────────── */
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

  /* ── Screen 0.1: Invalid ──────────────────────────────────── */
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
        <button
          onClick={() => window.location.href = "/"}
          className="px-8 py-3 bg-primary text-white font-bold rounded-xl shadow-lg"
        >
          Return Home
        </button>
      </main>
    );
  }

  /* ── Screen 1: Consent ────────────────────────────────────── */
  if (phase === "consent") {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6 md:p-12 relative overflow-hidden bg-background">
        {/* Ambient blobs */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary-fixed/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-secondary-fixed/30 rounded-full blur-3xl" />
        </div>

        <div className="w-full max-w-5xl z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

            {/* Left — info */}
            <div className="lg:col-span-7 flex flex-col gap-8">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 premium-gradient rounded-xl flex items-center justify-center text-white shadow-lg">
                  <span className="material-symbols-outlined text-2xl">psychology</span>
                </div>
                <span className="text-2xl font-black tracking-tighter text-on-secondary-fixed">Chayan</span>
              </div>

              {/* Headline */}
              <div className="space-y-4">
                <p className="text-sm font-bold tracking-[0.1em] text-primary uppercase">Academic Atelier</p>
                <h1 className="text-5xl md:text-6xl font-bold text-on-surface tracking-tight leading-[1.1]">
                  Begin your<br />
                  <span className="text-primary italic">educational journey.</span>
                </h1>
                <p className="text-lg text-on-surface-variant max-w-md leading-relaxed">
                  Welcome to the Chayan expert screening. We&apos;ve curated a space for you to demonstrate your mastery through a voice-first interactive session.
                </p>
              </div>

              {/* Feature cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 rounded-2xl bg-surface-container-lowest shadow-[0_4px_20px_rgba(73,95,132,0.04)] flex flex-col gap-4">
                  <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-fixed">
                    <span className="material-symbols-outlined">record_voice_over</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-on-surface">Voice-First Experience</h3>
                    <p className="text-sm text-on-surface-variant mt-1">
                      Natural dialogue processing for real-time pedagogical assessment.
                    </p>
                  </div>
                </div>
                <div className="p-6 rounded-2xl bg-surface-container-lowest shadow-[0_4px_20px_rgba(73,95,132,0.04)] flex flex-col gap-4">
                  <div className="w-10 h-10 rounded-full bg-tertiary-fixed flex items-center justify-center text-on-tertiary-container">
                    <span className="material-symbols-outlined">timer</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-on-surface">15-Minute Duration</h3>
                    <p className="text-sm text-on-surface-variant mt-1">
                      A focused session designed to value your time and expertise.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right — consent panel */}
            <div className="lg:col-span-5">
              <div className="glass-panel p-8 md:p-10 rounded-2xl shadow-[0_12px_40px_rgba(73,95,132,0.08)] flex flex-col gap-8">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-on-surface">Candidate Consent</h2>
                  <p className="text-sm text-on-surface-variant">Please review our transparency guidelines before we begin.</p>
                </div>

                <div className="space-y-6">
                  <div className="flex gap-4">
                    <span className="material-symbols-outlined text-primary mt-0.5">verified_user</span>
                    <div>
                      <h4 className="text-sm font-bold text-on-surface">Data Privacy &amp; Security</h4>
                      <p className="text-xs text-on-surface-variant leading-relaxed mt-1">
                        Your voice responses are encrypted and used solely for candidate evaluation purposes by Chayan AI.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <span className="material-symbols-outlined text-primary mt-0.5">gavel</span>
                    <div>
                      <h4 className="text-sm font-bold text-on-surface">Ethical AI Framework</h4>
                      <p className="text-xs text-on-surface-variant leading-relaxed mt-1">
                        Our scoring models are audited for bias to ensure an equitable assessment for every educator.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-surface-container-low">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        id="consent-checkbox"
                        type="checkbox"
                        className="mt-1 w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary/20"
                        checked={consented}
                        onChange={(e) => setConsented(e.target.checked)}
                      />
                      <span className="text-xs text-on-surface-variant leading-relaxed select-none">
                        I consent to the recording of this session and agree to the{" "}
                        <span className="text-primary font-semibold underline decoration-primary/30">Terms of Service</span> and{" "}
                        <span className="text-primary font-semibold underline decoration-primary/30">Privacy Policy</span>.
                      </span>
                    </label>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <button
                    id="start-interview-btn"
                    className="w-full h-14 premium-gradient rounded-xl text-white font-bold text-lg shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                    disabled={!consented}
                    onClick={() => setPhase("interview")}
                  >
                    Accept &amp; Continue
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </button>
                  <button className="w-full h-12 bg-surface-container-high text-on-surface-variant font-medium rounded-xl hover:bg-surface-container-highest transition-colors">
                    Decline &amp; Exit
                  </button>
                </div>

                <div className="flex items-center justify-center gap-6">
                  <div className="w-8 h-8 rounded-full bg-surface-container-high opacity-60" />
                  <div className="h-4 w-px bg-outline-variant/30" />
                  <div className="flex items-center gap-1 opacity-60">
                    <span className="material-symbols-outlined text-sm">lock</span>
                    <span className="text-[10px] font-bold tracking-widest uppercase text-on-surface-variant">Secure Session</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Social proof footer */}
        <div className="absolute bottom-12 left-12 hidden lg:flex items-center gap-4 z-10">
          <div className="flex -space-x-3">
            <div className="w-10 h-10 rounded-full border-2 border-background bg-secondary/20 flex items-center justify-center text-secondary text-xs font-bold">AS</div>
            <div className="w-10 h-10 rounded-full border-2 border-background bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">RK</div>
            <div className="w-10 h-10 rounded-full border-2 border-background bg-secondary flex items-center justify-center text-[10px] font-bold text-white">+2k</div>
          </div>
          <p className="text-xs font-medium text-on-surface-variant">Join 2,000+ expert educators curated by Chayan AI.</p>
        </div>
      </main>
    );
  }

  /* ── Screen 3: Complete (thank you) ───────────────────────── */
  if (phase === "complete") {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-lg text-center flex flex-col items-center gap-8">
          <div className="w-20 h-20 rounded-full bg-tertiary-container flex items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-on-tertiary-container" style={{ fontVariationSettings: "'FILL' 1" }}>
              task_alt
            </span>
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl font-black text-on-secondary-fixed">Screening Complete</h1>
            <p className="text-on-surface-variant text-lg">
              Thank you for completing your Cuemath tutor screening.
            </p>
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
          {/* Dev-only: show report for demo */}
          {report && (
            <div className="w-full bg-surface-container-low rounded-2xl p-5 text-left text-xs text-on-surface-variant space-y-2 border border-outline-variant/20">
              <p className="font-bold text-on-secondary-fixed text-sm">AI Report Preview (recruiter view — demo only)</p>
              <p><strong>Recommendation:</strong> {report.recommendation}</p>
              <p><strong>Summary:</strong> {report.summary}</p>
              <p><strong>Next step:</strong> {report.nextStep}</p>
            </div>
          )}
          <button
            onClick={() => { setPhase("consent"); setQuestionIndex(0); setAnswers([]); setReport(null); setStatus("idle"); setError(""); setTranscriptDraft(""); setConsented(false); }}
            className="text-sm font-medium text-primary hover:underline"
          >
            ← Start over (demo)
          </button>
        </div>
      </main>
    );
  }

  /* ── Screen 2: Interview (two-column Figma layout) ─────────── */
  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* ── Top navigation bar ── */}
      <header className="glass-header sticky top-0 z-50 shadow-[0_4px_20px_rgba(73,95,132,0.04)]">
        <div className="flex justify-between items-center w-full px-6 md:px-8 py-4">
          <div className="flex items-center gap-6">
            <span className="text-xl font-black tracking-tighter text-on-secondary-fixed">InterviewAI</span>
            <span className="text-sm text-on-surface-variant font-medium hidden sm:inline">Candidate: Chayan</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-full text-secondary hover:bg-surface-container-high transition-colors">
              <span className="material-symbols-outlined text-[20px]">accessibility_new</span>
            </button>
            <button className="p-2 rounded-full text-secondary hover:bg-surface-container-high transition-colors">
              <span className="material-symbols-outlined text-[20px]">info</span>
            </button>
            <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-white text-xs font-bold">CH</div>
          </div>
        </div>
        {/* Progress bar */}
        <div className="w-full h-1 bg-surface-container-high">
          <div
            className="h-full bg-primary-container transition-all duration-500"
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="flex-1 flex flex-col items-center justify-start px-4 md:px-8 pt-8 md:pt-16 pb-28">
        {/* Question counter */}
        <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-8">
          Question {questionIndex + 1} of {questions.length}
        </p>

        {/* Two-column layout */}
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

          {/* Left column — Question */}
          <div className="lg:col-span-7">
            <div className="bg-surface-container-lowest rounded-2xl p-8 md:p-10 shadow-[0_4px_20px_rgba(73,95,132,0.04)] min-h-[240px] flex flex-col justify-center">
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

            {/* Transcript preview (below question card on mobile) */}
            {transcriptDraft && (
              <div className="mt-4 bg-surface-container-lowest rounded-2xl p-6 shadow-sm space-y-2">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Transcript Preview</p>
                <div className="bg-surface-container-low rounded-xl px-4 py-3 text-sm text-on-surface leading-relaxed italic">
                  &ldquo;{transcriptDraft}&rdquo;
                </div>
              </div>
            )}
          </div>

          {/* Right column — Recording panel */}
          <div className="lg:col-span-5 space-y-4">
            {/* Timer & waveform card */}
            <div className="bg-surface-container-lowest rounded-2xl p-8 shadow-[0_4px_20px_rgba(73,95,132,0.04)] flex flex-col items-center">
              {status === "recording" ? (
                <>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="recording-dot" aria-hidden="true" />
                    <span className="text-sm font-bold text-error uppercase tracking-widest">Recording</span>
                  </div>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-5xl font-black text-on-surface tabular-nums">{formatTime(elapsed)}</span>
                    <span className="text-xl text-on-surface-variant font-medium">/ {formatTime(MAX_SECONDS)}</span>
                  </div>
                  {/* Waveform */}
                  <div className="flex items-end gap-[3px] h-10 mb-3">
                    {waveform.map((h, i) => (
                      <div
                        key={i}
                        className="w-1.5 bg-primary-container rounded-full transition-all duration-75"
                        style={{ height: `${h}px` }}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-on-surface-variant">Voice activity detected</p>
                </>
              ) : status === "processing" ? (
                <div className="flex flex-col items-center gap-4 py-4">
                  <svg className="animate-spin w-10 h-10 text-primary" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  <p className="text-sm font-bold text-on-surface">Processing your answer…</p>
                  <p className="text-xs text-on-surface-variant">Transcribing and evaluating</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="w-16 h-16 rounded-full bg-surface-container-low flex items-center justify-center">
                    <span className="material-symbols-outlined text-3xl text-on-surface-variant">mic</span>
                  </div>
                  <p className="text-sm font-bold text-on-surface">Ready to record</p>
                  <p className="text-xs text-on-surface-variant text-center">Press the button below to start recording your answer</p>
                </div>
              )}
            </div>

            {/* Action buttons */}
            {status === "recording" && (
              <div className="space-y-3">
                <button
                  onClick={handleReRecord}
                  className="w-full py-4 bg-surface-container-high text-on-surface-variant font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-surface-container-highest transition-colors active:scale-[0.98]"
                >
                  <span className="material-symbols-outlined text-[20px]">replay</span>
                  Re-record
                </button>
                <button
                  id="stop-submit-btn"
                  onClick={stopAndSubmit}
                  className="w-full py-4 bg-surface-container-high text-on-surface-variant font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-surface-container-highest transition-colors active:scale-[0.98]"
                >
                  <span className="material-symbols-outlined text-[20px]">check_circle</span>
                  Submit Answer
                </button>
              </div>
            )}

            {status === "idle" && (
              <label
                id="upload-audio-label"
                className="w-full py-4 bg-surface-container-high text-on-surface-variant font-bold rounded-2xl flex items-center justify-center gap-2 cursor-pointer hover:bg-surface-container-highest transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">upload</span>
                Upload Audio File
                <input
                  id="upload-audio-input"
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  disabled={status !== "idle"}
                  onChange={(e) => handleUpload(e.target.files?.[0] ?? null)}
                />
              </label>
            )}
          </div>
        </div>

        {/* Center CTA button */}
        <div className="mt-8 md:mt-12">
          {status === "recording" ? (
            <button
              onClick={stopAndSubmit}
              className="px-12 py-5 premium-gradient rounded-2xl text-white font-bold text-lg shadow-xl flex items-center gap-3 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[24px]">stop</span>
              Stop Recording
            </button>
          ) : status === "idle" ? (
            <button
              id="record-answer-btn"
              onClick={startRecording}
              className="px-12 py-5 premium-gradient rounded-2xl text-white font-bold text-lg shadow-xl flex items-center gap-3 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[24px]">mic</span>
              Start Recording
            </button>
          ) : null}
        </div>

        {/* Error */}
        {error && (
          <div id="error-message" role="alert" className="mt-6 max-w-md bg-error-container text-on-error-container text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}
      </main>

      {/* ── Bottom status bar ── */}
      <footer className="fixed bottom-0 left-0 right-0 bg-on-secondary-fixed/95 backdrop-blur-md text-white py-3 px-6 flex items-center justify-between z-40">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-primary-container">mic</span>
            <span className="text-xs font-medium">Microphone:</span>
            <span className="text-xs font-bold text-tertiary-fixed">Active</span>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-primary-container">videocam</span>
            <span className="text-xs font-medium">Camera:</span>
            <span className="text-xs font-bold text-tertiary-fixed">Active</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">wifi</span>
            <span className="text-xs font-medium">Connected</span>
          </div>
          <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition-colors">
            <span className="material-symbols-outlined text-[18px]">help</span>
            <span className="text-xs font-bold">Need Help?</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
