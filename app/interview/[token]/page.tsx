"use client";

import { useEffect, useState, use } from "react";
import Welcome from "../../components/candidate/Welcome";
import Interview from "../../components/candidate/Interview";
import Complete from "../../components/candidate/Complete";
import { useAssessmentSecurity } from "../../hooks/useAssessmentSecurity";
import { useInterviewSession } from "../../hooks/useInterviewSession";
import { useMediaRecorder } from "../../hooks/useMediaRecorder";
import { useInterviewAudio } from "../../hooks/useInterviewAudio";

export default function InterviewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);

  const {
    phase,
    setPhase,
    session,
    questions,
    questionIndex,
    currentQuestion,
    answers,
    status: sessionStatus,
    processingStep,
    processingProgress,
    error: sessionError,
    totalTimeLeft,
    startAssessment,
    submitAnswer,
    setError: setSessionError,
  } = useInterviewSession({
    token,
    onSecurityViolation: (type) => {
      setPhase("security_violation");
    }
  });

  const {
    status: recordStatus,
    waveform,
    startRecording,
    stopRecording,
  } = useMediaRecorder({
    onStop: (blob) => submitAnswer(blob),
    onError: (err) => setSessionError(err),
  });

  const { isTtsLoading, playTTS } = useInterviewAudio();
  const [playedQuestions, setPlayedQuestions] = useState<Set<number>>(new Set());

  /* Security Logic */
  const { enterFullscreen } = useAssessmentSecurity({
    enabled: phase === "interview",
    onViolation: (type) => {
      console.warn("Security violation:", type);
      setPhase("security_violation");
    }
  });

  const handleStartAssessment = async () => {
    await enterFullscreen();
    await startAssessment();
  };

  const handleStartRecording = () => {
    setSessionError("");
    startRecording();
  };

  /* Auto-play question on change - Only once */
  useEffect(() => {
    if (phase === "interview" && currentQuestion?.prompt && !playedQuestions.has(questionIndex)) {
      const timer = setTimeout(() => {
        playTTS(currentQuestion.prompt);
        setPlayedQuestions(prev => {
          const next = new Set(prev);
          next.add(questionIndex);
          return next;
        });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [phase, currentQuestion?.prompt, questionIndex, playTTS, playedQuestions]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const progress = (questions && questions.length > 0) 
    ? Math.round(((questionIndex + 1) / questions.length) * 100) 
    : 0;

  if (phase === "loading") {
    return <div className="min-h-screen flex items-center justify-center text-on-surface-variant font-medium">Validating invitation...</div>;
  }

  if (phase === "security_violation") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-error-container text-on-error-container text-center">
        <h1 className="text-4xl font-black mb-4 tracking-tighter uppercase">Assessment Locked</h1>
        <p className="max-w-md mb-8">A security violation was detected (tab switch or dev-tool access). This attempt has been flagged and your recruiter has been notified.</p>
        <button onClick={() => window.location.href = "/"} className="px-8 py-3 bg-error text-white rounded-xl font-bold shadow-lg">Return Home</button>
      </div>
    );
  }

  if (phase === "consent") {
    return <Welcome onAccept={handleStartAssessment} onDecline={() => window.location.href = "https://cuemath.com"} session={session} />;
  }

  if (phase === "complete") {
    return <Complete answersCount={answers.length} />;
  }

  if (phase === "invalid") {
    return <div className="min-h-screen flex items-center justify-center text-error font-bold">Invalid or expired invitation.</div>;
  }

  if (!questions || questions.length === 0) return null;

  const combinedStatus = sessionStatus === "idle" 
    ? (recordStatus === "recording" ? "recording" : "idle") 
    : sessionStatus;

  return (
    <Interview 
      questionIndex={questionIndex}
      totalQuestions={questions.length}
      currentQuestion={currentQuestion!}
      status={combinedStatus as any}
      elapsed={totalTimeLeft}
      maxSeconds={0}
      processingStep={processingStep}
      processingProgress={processingProgress}
      error={sessionError}
      waveform={waveform}
      onStartRecording={handleStartRecording}
      onStopRecording={stopRecording}
      formatTime={formatTime}
      progress={progress}
      session={session}
      onPlayTts={() => playTTS(currentQuestion!.prompt)}
      isTtsLoading={isTtsLoading}
    />
  );
}
