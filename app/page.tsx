"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AnswerEvaluation, FinalReport } from "@/lib/types";
import Welcome from "./components/candidate/Welcome";
import Interview from "./components/candidate/Interview";
import Complete from "./components/candidate/Complete";

type Answer = {
  questionId: string;
  question: string;
  transcript: string;
  evaluation: AnswerEvaluation;
};

type Question = {
  id: string;
  prompt: string;
  guidance?: string;
  competencyTags: string[];
};

type Phase = "loading" | "invalid" | "consent" | "interview" | "complete";
type RecordStatus = "idle" | "recording" | "processing" | "error";

export default function Home() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [session, setSession] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [status, setStatus] = useState<RecordStatus>("idle");
  const [processingStep, setProcessingStep] = useState<string>("");
  const [error, setError] = useState("");
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [report, setReport] = useState<FinalReport | null>(null);
  
  const [followUpQuestion, setFollowUpQuestion] = useState<string | null>(null);
  const [hasAskedFollowUp, setHasAskedFollowUp] = useState(false);
  const [isTtsLoading, setIsTtsLoading] = useState(false);

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  /* Timer state */
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const MAX_SECONDS = 180; // 3 minutes

  /* Waveform bars */
  const [waveform, setWaveform] = useState<number[]>(Array(20).fill(4));
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const currentQuestion = useMemo(() => {
    if (questions.length === 0) return null;
    if (followUpQuestion) {
      return { 
        id: `follow-up-${questions[questionIndex].id}`, 
        prompt: followUpQuestion, 
        guidance: "This is a follow-up question based on your previous response.",
        competencyTags: questions[questionIndex].competencyTags
      };
    }
    return questions[questionIndex];
  }, [questions, questionIndex, followUpQuestion]);

  const progress = useMemo(
    () => questions.length > 0 ? Math.round(((questionIndex) / questions.length) * 100) : 0,
    [questionIndex, questions.length]
  );

  /* Play TTS for the current question */
  const playTTS = useCallback(async (text: string) => {
    if (isTtsLoading) return;
    setIsTtsLoading(true);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }

      const audio = new Audio(`data:audio/mp3;base64,${data.audio}`);
      audioPlayerRef.current = audio;
      audio.play();
    } catch (err) {
      console.error("TTS playback failed:", err);
    } finally {
      setIsTtsLoading(false);
    }
  }, [isTtsLoading]);

  /* Auto-play question on change */
  useEffect(() => {
    if (phase === "interview" && currentQuestion?.prompt) {
      // Small delay to allow transition
      const timer = setTimeout(() => {
        playTTS(currentQuestion.prompt);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [phase, currentQuestion?.prompt, playTTS]);

  /* Validate Invite on Mount */
  useEffect(() => {
    async function validate() {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get("invite");

      if (!token) {
        // Fetch default questions if no token
        try {
          const qRes = await fetch("/api/questions?questionSetId=default");
          if (qRes.ok) {
            const qData = await qRes.json();
            if (qData.questions.length > 0) {
              setQuestions(qData.questions);
            } else {
              const fallback = await import("@/lib/questions");
              setQuestions(fallback.questions as unknown as Question[]);
            }
          } else {
            const fallback = await import("@/lib/questions");
            setQuestions(fallback.questions as unknown as Question[]);
          }
        } catch {
          const fallback = await import("@/lib/questions");
          setQuestions(fallback.questions as unknown as Question[]);
        }
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

        const qRes = await fetch(`/api/questions?questionSetId=${data.session.questionSetId}`);
        if (qRes.ok) {
          const qData = await qRes.json();
          if (qData.questions.length > 0) {
            setQuestions(qData.questions);
          } else {
            const fallback = await import("@/lib/questions");
            setQuestions(fallback.questions as unknown as Question[]);
          }
        } else {
          const fallback = await import("@/lib/questions");
          setQuestions(fallback.questions as unknown as Question[]);
        }

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
      setError("Your browser doesn't support recording.");
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
      setError("Microphone access was blocked.");
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

  async function processAudio(audio: Blob) {
    if (!currentQuestion) return;
    setStatus("processing");
    setProcessingStep("Uploading your answer...");
    try {
      const form = new FormData();
      form.append("audio", audio, "answer.webm");
      form.append("sessionId", session?.id || "demo");
      form.append("questionId", currentQuestion.id);
      form.append("question", currentQuestion.prompt);
      
      const competencyTags = "competencyTags" in currentQuestion ? currentQuestion.competencyTags : [];
      form.append("competencyTags", JSON.stringify(competencyTags));

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
        } else if (statusData.status === "NEEDS_RETRY") {
          throw new Error("Your answer was too short or unclear. Please provide a more detailed response.");
        } else if (statusData.status === "FAILED") {
          throw new Error("AI processing failed. Please try again.");
        }
      }

      if (!evaluation) throw new Error("Processing timed out.");

      const nextAnswers: Answer[] = [
        ...answers,
        { questionId: currentQuestion.id, question: currentQuestion.prompt, transcript, evaluation },
      ];
      setAnswers(nextAnswers);

      if (evaluation.followUpQuestion && !hasAskedFollowUp) {
        setFollowUpQuestion(evaluation.followUpQuestion);
        setHasAskedFollowUp(true);
        setStatus("idle");
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
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong.");
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

  if (phase === "consent") {
    return <Welcome onAccept={() => setPhase("interview")} onDecline={() => window.location.href = "https://cuemath.com"} />;
  }

  if (phase === "complete") {
    return <Complete answersCount={answers.length} />;
  }

  if (!currentQuestion) {
    return null;
  }

  return (
    <Interview 
      questionIndex={questionIndex}
      totalQuestions={questions.length}
      currentQuestion={currentQuestion}
      status={status}
      elapsed={elapsed}
      maxSeconds={MAX_SECONDS}
      processingStep={processingStep}
      error={error}
      waveform={waveform}
      onStartRecording={startRecording}
      onStopRecording={stopAndSubmit}
      formatTime={formatTime}
      progress={progress}
      session={session}
      onPlayTts={() => playTTS(currentQuestion.prompt)}
      isTtsLoading={isTtsLoading}
    />
  );
}
