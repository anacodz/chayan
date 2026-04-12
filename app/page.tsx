"use client";

import { useMemo, useRef, useState } from "react";
import { questions } from "@/lib/questions";
import type { AnswerEvaluation, FinalReport } from "@/lib/types";

type Answer = {
  questionId: string;
  question: string;
  transcript: string;
  evaluation: AnswerEvaluation;
};

type Phase = "consent" | "interview" | "complete";
type RecordStatus = "idle" | "recording" | "processing" | "error";

export default function Home() {
  const [phase, setPhase] = useState<Phase>("consent");
  const [consented, setConsented] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [status, setStatus] = useState<RecordStatus>("idle");
  const [error, setError] = useState("");
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [report, setReport] = useState<FinalReport | null>(null);
  const [transcriptDraft, setTranscriptDraft] = useState("");
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  const currentQuestion = questions[questionIndex];
  const progress = useMemo(
    () => Math.round((answers.length / questions.length) * 100),
    [answers.length]
  );

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

      const nextAnswers: Answer[] = [
        ...answers,
        { questionId: currentQuestion.id, question: currentQuestion.prompt, transcript, evaluation: ePayload.evaluation as AnswerEvaluation },
      ];
      setAnswers(nextAnswers);

      if (nextAnswers.length === questions.length) {
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
                <p className="text-sm font-bold tracking-[0.1em] text-primary uppercase">Cuemath Tutor Screening</p>
                <h1 className="text-5xl md:text-6xl font-bold text-on-surface tracking-tight leading-[1.1]">
                  Let&apos;s hear<br />
                  <span className="text-primary italic">how you teach.</span>
                </h1>
                <p className="text-lg text-on-surface-variant max-w-md leading-relaxed">
                  You&apos;ll answer {questions.length} short questions about teaching. Record your answers in the browser — no app needed. This takes about 10–15 minutes.
                </p>
              </div>

              {/* Feature cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 rounded-2xl bg-surface-container-lowest shadow-sm flex flex-col gap-4">
                  <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-fixed">
                    <span className="material-symbols-outlined">record_voice_over</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-on-surface">Voice–First</h3>
                    <p className="text-sm text-on-surface-variant mt-1">
                      Answer using your microphone. Upload an audio file if recording isn&apos;t available.
                    </p>
                  </div>
                </div>
                <div className="p-6 rounded-2xl bg-surface-container-lowest shadow-sm flex flex-col gap-4">
                  <div className="w-10 h-10 rounded-full bg-tertiary-fixed flex items-center justify-center text-on-tertiary-container">
                    <span className="material-symbols-outlined">timer</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-on-surface">~15 Minutes</h3>
                    <p className="text-sm text-on-surface-variant mt-1">
                      A focused session. Take your time with each answer — there&apos;s no rush.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right — consent panel */}
            <div className="lg:col-span-5">
              <div className="glass-panel p-8 md:p-10 rounded-2xl shadow-lg flex flex-col gap-8">
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold text-on-surface">Before you begin</h2>
                  <p className="text-sm text-on-surface-variant">Please read this before recording.</p>
                </div>

                <div className="space-y-6">
                  <div className="flex gap-4">
                    <span className="material-symbols-outlined text-primary mt-0.5">verified_user</span>
                    <div>
                      <h4 className="text-sm font-bold text-on-surface">Data Privacy</h4>
                      <p className="text-xs text-on-surface-variant leading-relaxed mt-1">
                        Your voice responses are encrypted and used solely for evaluation by Cuemath&apos;s hiring team.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <span className="material-symbols-outlined text-primary mt-0.5">gavel</span>
                    <div>
                      <h4 className="text-sm font-bold text-on-surface">Fair Assessment</h4>
                      <p className="text-xs text-on-surface-variant leading-relaxed mt-1">
                        Our AI models are evaluated for bias to ensure every candidate is assessed fairly and consistently.
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
                        I consent to the recording of this session and understand that my responses will be used for Cuemath&apos;s hiring process.
                      </span>
                    </label>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    id="start-interview-btn"
                    className="w-full h-14 premium-gradient rounded-xl text-white font-bold text-base shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                    disabled={!consented}
                    onClick={() => setPhase("interview")}
                  >
                    Accept &amp; Begin Interview
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </button>
                  <button className="w-full h-12 bg-surface-container-high text-on-surface-variant font-medium rounded-xl hover:bg-surface-container-highest transition-colors">
                    Decline &amp; Exit
                  </button>
                </div>

                <div className="flex items-center justify-center gap-2 opacity-50">
                  <span className="material-symbols-outlined text-sm text-on-surface-variant">lock</span>
                  <span className="text-[10px] font-bold tracking-widest uppercase text-on-surface-variant">Secure Session</span>
                </div>
              </div>
            </div>

          </div>
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

  /* ── Screen 2: Interview ──────────────────────────────────── */
  return (
    <main className="min-h-screen bg-background flex items-start justify-center p-6 pt-12">
      <div className="w-full max-w-2xl flex flex-col gap-6">

        {/* Top bar */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-2xl font-black tracking-tighter text-on-secondary-fixed">Chayan</span>
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
            Cuemath Tutor Screening
          </span>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold text-on-surface-variant uppercase tracking-widest">
            <span>Question {questionIndex + 1} of {questions.length}</span>
            <span>{progress}% complete</span>
          </div>
          <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-container rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>

        {/* Question card */}
        <div className="bg-surface-container-lowest rounded-2xl p-8 shadow-sm">
          <span className="text-xs font-bold text-primary uppercase tracking-widest">
            Question {questionIndex + 1}
          </span>
          <h2 className="text-2xl font-bold text-on-surface mt-2 mb-3">
            {currentQuestion.prompt}
          </h2>
          {currentQuestion.guidance && (
            <p className="text-sm text-on-surface-variant leading-relaxed">
              {currentQuestion.guidance}
            </p>
          )}
        </div>

        {/* Recorder card */}
        <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm space-y-4">
          {status === "recording" ? (
            <>
              <div className="flex items-center gap-3">
                <span className="recording-dot" aria-hidden="true" />
                <span className="text-sm font-bold text-on-surface">Recording…</span>
                <span className="text-xs text-on-surface-variant">Speak clearly into your microphone</span>
              </div>
              <button
                id="stop-submit-btn"
                onClick={stopAndSubmit}
                className="w-full py-4 rounded-xl bg-error text-white font-bold flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined">stop</span>
                Stop &amp; Submit Answer
              </button>
            </>
          ) : (
            <div className="flex gap-3 flex-wrap">
              <button
                id="record-answer-btn"
                onClick={startRecording}
                disabled={status === "processing"}
                className="flex-1 py-4 premium-gradient text-white font-bold rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === "processing" ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Processing…
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">mic</span>
                    Record Answer
                  </>
                )}
              </button>

              <label
                id="upload-audio-label"
                className="flex-1 py-4 border border-outline-variant/50 text-on-surface-variant font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer hover:bg-surface-container-low transition-colors"
                style={{ pointerEvents: status === "processing" ? "none" : "auto" }}
              >
                <span className="material-symbols-outlined">upload</span>
                Upload Audio
                <input
                  id="upload-audio-input"
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  disabled={status === "processing"}
                  onChange={(e) => handleUpload(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>
          )}

          {status === "processing" && !transcriptDraft && (
            <p className="text-xs text-on-surface-variant bg-surface-container-low rounded-xl px-4 py-3">
              Transcribing and evaluating your answer — this takes a few seconds…
            </p>
          )}

          {transcriptDraft && (
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Transcript Preview</p>
              <div className="bg-surface-container-low rounded-xl px-4 py-3 text-sm text-on-surface leading-relaxed italic">
                &ldquo;{transcriptDraft}&rdquo;
              </div>
            </div>
          )}

          {error && (
            <div id="error-message" role="alert" className="bg-error-container text-on-error-container text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
