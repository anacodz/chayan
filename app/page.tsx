"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AnswerEvaluation, FinalReport } from "@/lib/types";
import Welcome from "./components/candidate/Welcome";
import Interview from "./components/candidate/Interview";
import Complete from "./components/candidate/Complete";
import { useAssessmentSecurity } from "./hooks/useAssessmentSecurity";

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
  maxDurationSeconds: number;
};

type Phase = "loading" | "invalid" | "consent" | "interview" | "complete" | "security_violation";
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

  const [totalTimeLeft, setTotalTimeLeft] = useState(0); // Total assessment timer
  const globalTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  /* Security Logic */
  const { enterFullscreen } = useAssessmentSecurity({
    enabled: phase === "interview",
    onViolation: (type) => {
      console.warn("Security violation:", type);
      // For high stakes, we move to a locked violation screen
      setPhase("security_violation");
    }
  });

  const handleStartAssessment = async () => {
    await enterFullscreen();
    setPhase("interview");
    
    // Start global timer (sum of all question durations + buffer)
    const totalDuration = (questions || []).reduce((acc, q) => acc + (q?.maxDurationSeconds || 90), 0);
    setTotalTimeLeft(totalDuration);
    globalTimerRef.current = setInterval(() => {
      setTotalTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(globalTimerRef.current!);
          // Auto-submit if time runs out
          if (phase === "interview") setPhase("complete");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  /* Waveform and Audio logic same as before... */
  const [waveform, setWaveform] = useState<number[]>(Array(20).fill(4));
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const currentQuestion = useMemo(() => {
    if (!questions || questions.length === 0) return null;
    if (followUpQuestion) {
      return { 
        id: `follow-up-${questions[questionIndex]?.id || "fup"}`, 
        prompt: followUpQuestion, 
        guidance: "This is a follow-up question based on your previous response.",
        competencyTags: questions[questionIndex]?.competencyTags || [],
        maxDurationSeconds: 60 // Follow-ups get fixed 60s
      };
    }
    return questions[questionIndex];
  }, [questions, questionIndex, followUpQuestion]);

  const progress = useMemo(
    () => (questions && questions.length > 0) ? Math.round(((questionIndex) / questions.length) * 100) : 0,
    [questionIndex, questions?.length]
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

      if (audioPlayerRef.current) audioPlayerRef.current.pause();
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
      const timer = setTimeout(() => { playTTS(currentQuestion.prompt); }, 500);
      return () => clearTimeout(timer);
    }
  }, [phase, currentQuestion?.prompt, playTTS]);

  /* Validate Invite on Mount */
  useEffect(() => {
    async function validate() {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get("invite");

      try {
        let qSetId = "default";
        
        if (token) {
          const sRes = await fetch(`/api/invites/${token}`);
          if (sRes.ok) {
            const sData = await sRes.json();
            if (sData.session) {
              setSession(sData.session);
              qSetId = sData.session.questionSetId || "default";
            }
          }
        }
        
        const qRes = await fetch(`/api/questions?questionSetId=${qSetId}`);
        if (qRes.ok) {
          const qData = await qRes.json();
          setQuestions(qData.questions || []);
        } else {
          setPhase("invalid");
          return;
        }
        
        setPhase("consent");
      } catch (err) {
        console.error("Initialization failed:", err);
        setPhase("invalid");
      }
    }
    validate();
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  /* Waveform animation... */
  useEffect(() => {
    if (status === "recording" && analyserRef.current) {
      const tick = () => {
        const dataArray = new Uint8Array(analyserRef.current!.frequencyBinCount);
        analyserRef.current!.getByteFrequencyData(dataArray);
        const bars: number[] = [];
        const sliceWidth = Math.floor(dataArray.length / 20);
        for (let i = 0; i < 20; i++) {
          let sum = 0;
          for (let j = 0; j < sliceWidth; j++) sum += dataArray[i * sliceWidth + j];
          bars.push(Math.max(4, (sum / sliceWidth / 255) * 40));
        }
        setWaveform(bars);
        animFrameRef.current = requestAnimationFrame(tick);
      };
      tick();
    } else if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
  }, [status]);

  /* ── Recording logic ──────────────────────────────────────── */
  async function startRecording() {
    setError("");
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
      setError("Microphone access blocked.");
    }
  }

  async function stopAndSubmit() {
    if (!mediaRecorder.current || mediaRecorder.current.state === "inactive") return;
    mediaRecorder.current.stop();
    const audio = new Blob(audioChunks.current, { type: mediaRecorder.current.mimeType || "audio/webm" });
    await processAudio(audio);
  }

  async function processAudio(audio: Blob) {
    if (!currentQuestion) return;
    setStatus("processing");
    setProcessingStep("Analyzing...");
    try {
      const form = new FormData();
      form.append("audio", audio, "answer.webm");
      form.append("sessionId", session?.id || "demo");
      form.append("questionId", currentQuestion.id);
      form.append("question", currentQuestion.prompt);
      form.append("competencyTags", JSON.stringify("competencyTags" in currentQuestion ? currentQuestion.competencyTags : []));

      const uploadRes = await fetch("/api/answers/upload", { method: "POST", body: form });
      const uploadData = await uploadRes.json();
      const answerId = uploadData.answerId;

      let evaluation: AnswerEvaluation | null = null;
      let transcript = "";
      for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const statusRes = await fetch(`/api/answers/${answerId}/status`);
        const statusData = await statusRes.json();
        if (statusData.status === "EVALUATED") {
          evaluation = statusData.evaluation;
          transcript = statusData.transcript;
          break;
        } else if (statusData.status === "NEEDS_RETRY") throw new Error("Answer too short.");
      }

      if (!evaluation) throw new Error("Timed out.");
      const nextAnswers = [...answers, { questionId: currentQuestion.id, question: currentQuestion.prompt, transcript, evaluation }];
      setAnswers(nextAnswers);

      if (evaluation.followUpQuestion && !hasAskedFollowUp) {
        setFollowUpQuestion(evaluation.followUpQuestion);
        setHasAskedFollowUp(true);
        setStatus("idle");
        return;
      }

      setFollowUpQuestion(null);
      setHasAskedFollowUp(false);

      if (questionIndex === (questions?.length || 0) - 1) {
        await buildReport(nextAnswers);
        return;
      }
      setQuestionIndex((i) => i + 1);
      setStatus("idle");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Error.");
    }
  }

  async function buildReport(done: Answer[]) {
    await fetch("/api/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers: done, sessionId: session?.id }),
    });
    if (globalTimerRef.current) clearInterval(globalTimerRef.current);
    setPhase("complete");
  }

  if (phase === "loading") return <div className="min-h-screen flex items-center justify-center text-on-surface-variant font-medium">Validating invitation...</div>;
  if (phase === "security_violation") return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-error-container text-on-error-container text-center">
      <h1 className="text-4xl font-black mb-4 tracking-tighter uppercase">Assessment Locked</h1>
      <p className="max-w-md mb-8">A security violation was detected (tab switch or dev-tool access). This attempt has been flagged and your recruiter has been notified.</p>
      <button onClick={() => window.location.href = "/"} className="px-8 py-3 bg-error text-white rounded-xl font-bold shadow-lg">Return Home</button>
    </div>
  );

  if (phase === "consent") return <Welcome onAccept={handleStartAssessment} onDecline={() => window.location.href = "https://cuemath.com"} session={session} />;
  if (phase === "complete") return <Complete answersCount={answers.length} />;

  if (!questions || questions.length === 0) return null;

  return (
    <Interview 
      questionIndex={questionIndex}
      totalQuestions={questions?.length || 0}
      currentQuestion={currentQuestion!}
      status={status}
      elapsed={totalTimeLeft} // Global timer
      maxSeconds={0} // Not used for global
      processingStep={processingStep}
      error={error}
      waveform={waveform}
      onStartRecording={startRecording}
      onStopRecording={stopAndSubmit}
      formatTime={formatTime}
      progress={progress}
      session={session}
      onPlayTts={() => playTTS(currentQuestion!.prompt)}
      isTtsLoading={isTtsLoading}
    />
  );
}
