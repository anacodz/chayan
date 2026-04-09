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

type Status = "idle" | "recording" | "processing" | "complete" | "error";

const DIMENSION_LABELS: Record<string, string> = {
  communicationClarity: "Communication",
  conceptExplanation: "Concept Explanation",
  empathyAndPatience: "Empathy & Patience",
  adaptability: "Adaptability",
  professionalism: "Professionalism",
  englishFluency: "English Fluency"
};

function RecommendationBadge({ rec }: { rec: FinalReport["recommendation"] }) {
  if (rec === "MOVE_FORWARD") {
    return (
      <span className="badge badge-move-forward" role="status">
        <span aria-hidden="true">✓</span> Move Forward
      </span>
    );
  }
  if (rec === "HOLD") {
    return (
      <span className="badge badge-hold" role="status">
        <span aria-hidden="true">⏸</span> Hold
      </span>
    );
  }
  return (
    <span className="badge badge-decline" role="status">
      <span aria-hidden="true">✕</span> Decline
    </span>
  );
}

export default function Home() {
  const [started, setStarted] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [status, setStatus] = useState<Status>("idle");
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

  async function startRecording() {
    setError("");

    if (!navigator.mediaDevices?.getUserMedia) {
      setError(
        "This browser does not support microphone recording. Try uploading an audio file instead."
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunks.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorder.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunks.current.push(event.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setStatus("recording");
    } catch {
      setError(
        "Microphone permission was blocked. Enable mic access in your browser settings or upload an audio file."
      );
    }
  }

  async function stopAndSubmitRecording() {
    const recorder = mediaRecorder.current;
    if (!recorder || recorder.state === "inactive") return;

    await new Promise<void>((resolve) => {
      recorder.addEventListener("stop", () => resolve(), { once: true });
      recorder.stop();
    });

    const audio = new Blob(audioChunks.current, {
      type: recorder.mimeType || "audio/webm"
    });
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
      const formData = new FormData();
      formData.append("audio", audio, "answer.webm");

      const transcribeRes = await fetch("/api/transcribe", {
        method: "POST",
        body: formData
      });
      const transcribePayload = await transcribeRes.json();

      if (!transcribeRes.ok) {
        throw new Error(transcribePayload.error || "Transcription failed.");
      }

      const transcript = transcribePayload.transcript as string;
      setTranscriptDraft(transcript);

      const evaluateRes = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: currentQuestion.prompt,
          competencyTags: currentQuestion.competencyTags,
          transcript
        })
      });
      const evaluationPayload = await evaluateRes.json();

      if (!evaluateRes.ok) {
        throw new Error(evaluationPayload.error || "Evaluation failed.");
      }

      const nextAnswers = [
        ...answers,
        {
          questionId: currentQuestion.id,
          question: currentQuestion.prompt,
          transcript,
          evaluation: evaluationPayload.evaluation as AnswerEvaluation
        }
      ];

      setAnswers(nextAnswers);

      if (nextAnswers.length === questions.length) {
        await finalizeReport(nextAnswers);
        return;
      }

      setQuestionIndex((v) => v + 1);
      setStatus("idle");
      setTranscriptDraft("");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  async function finalizeReport(completedAnswers: Answer[]) {
    const res = await fetch("/api/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers: completedAnswers })
    });
    const payload = await res.json();

    if (!res.ok) {
      throw new Error(payload.error || "Report generation failed.");
    }

    setReport(payload.report as FinalReport);
    setStatus("complete");
  }

  function resetInterview() {
    setStarted(false);
    setQuestionIndex(0);
    setStatus("idle");
    setError("");
    setAnswers([]);
    setReport(null);
    setTranscriptDraft("");
  }

  /* ── Welcome screen ─────────────────────────────────────────── */
  if (!started) {
    return (
      <main className="screen">
        <div className="container fade-in">
          <div>
            <p className="eyebrow">Cuemath Tutor Screening</p>
            <h1>
              <span className="gradient-text">Chayan</span>
            </h1>
            <p className="lede" style={{ marginTop: "16px" }}>
              Complete a short voice interview from your browser. You&apos;ll answer
              {" "}<strong style={{ color: "#f4f4f5" }}>{questions.length} questions</strong> — takes
              about 5–10 minutes.
            </p>
          </div>

          <div className="card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <h2 style={{ margin: 0 }}>Before you start</h2>
            <ul className="clean">
              <li>You&apos;ll need to grant microphone access</li>
              <li>Speak clearly — your answers are transcribed automatically</li>
              <li>You can upload a pre-recorded audio file as a fallback</li>
              <li>Your responses are evaluated against a tutor-readiness rubric</li>
            </ul>
            <p className="notice notice-info" style={{ marginTop: "4px" }}>
              By clicking &quot;Start Interview&quot; you consent to your voice being recorded and processed for the purposes of this screening. Recordings are retained per our data policy.
            </p>
          </div>

          <button
            id="start-interview-btn"
            className="btn btn-primary"
            style={{ alignSelf: "flex-start", height: "52px", fontSize: "1rem" }}
            onClick={() => setStarted(true)}
          >
            Start Interview →
          </button>
        </div>
      </main>
    );
  }

  /* ── Report screen ──────────────────────────────────────────── */
  if (report) {
    return (
      <main className="screen" style={{ paddingTop: "48px", paddingBottom: "48px" }}>
        <div className="container-wide fade-in">
          {/* Header */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <p className="eyebrow">Assessment Report</p>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
              <h1 style={{ fontSize: "2.6rem", margin: 0 }}>Screening Complete</h1>
              <RecommendationBadge rec={report.recommendation} />
            </div>
            <p className="muted">{report.summary}</p>
          </div>

          {/* Scores */}
          <div className="card" style={{ gap: "20px", display: "flex", flexDirection: "column" }}>
            <h2>Dimension Scores</h2>
            <div className="score-grid">
              {Object.entries(report.dimensionScores).map(([key, score]) => (
                <div className="score-card" key={key}>
                  <span className="score-label">{DIMENSION_LABELS[key] ?? key}</span>
                  <span className="score-value">{score}</span>
                  <div className="score-bar">
                    <div
                      className="score-bar-fill"
                      style={{ width: `${(score / 5) * 100}%` }}
                    />
                  </div>
                  <span className="muted" style={{ fontSize: "0.7rem" }}>out of 5</span>
                </div>
              ))}
            </div>
          </div>

          {/* Strengths + Concerns */}
          <div className="columns">
            <div className="card-sm" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <h2 style={{ color: "var(--color-brand-400)" }}>Strengths</h2>
              <ul className="clean">
                {report.strengths.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
            <div className="card-sm" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <h2 style={{ color: "var(--color-danger)" }}>Concerns</h2>
              {report.concerns.length > 0 ? (
                <ul className="clean">
                  {report.concerns.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              ) : (
                <p className="muted">No significant concerns identified.</p>
              )}
            </div>
          </div>

          {/* Evidence */}
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <h2>Answer Evidence</h2>
            {answers.map((answer, i) => (
              <div className="answer-block" key={answer.questionId}>
                <p className="eyebrow" style={{ marginBottom: "4px" }}>Question {i + 1}</p>
                <h3>{answer.question}</h3>
                <div className="transcript-block">&ldquo;{answer.transcript}&rdquo;</div>
                <p className="muted">{answer.evaluation.reasoning}</p>
              </div>
            ))}
          </div>

          {/* Next step */}
          <div className="notice notice-info">
            <strong>Recruiter note:</strong> {report.nextStep}
          </div>

          <button
            id="restart-btn"
            className="btn btn-ghost"
            style={{ alignSelf: "flex-start" }}
            onClick={resetInterview}
          >
            ← Start over
          </button>
        </div>
      </main>
    );
  }

  /* ── Interview question screen ──────────────────────────────── */
  return (
    <main className="screen">
      <div className="container fade-in">
        {/* Progress */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div className="topbar">
            <p className="eyebrow" style={{ margin: 0 }}>
              Question {questionIndex + 1} of {questions.length}
            </p>
            <span className="muted">{progress}% complete</span>
          </div>
          <div className="progress-track" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Question card */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <p className="eyebrow">Your question</p>
          <h1 style={{ fontSize: "clamp(1.4rem, 4vw, 2rem)" }}>{currentQuestion.prompt}</h1>
          <p className="muted">{currentQuestion.guidance}</p>
        </div>

        {/* Recorder */}
        <div className="card-sm" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {status === "recording" ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span className="recording-ring">
                  <span className="recording-dot" aria-hidden="true" />
                  Recording
                </span>
                <span className="muted" style={{ fontSize: "0.85rem" }}>
                  Speak clearly into your microphone
                </span>
              </div>
              <button
                id="stop-submit-btn"
                className="btn btn-danger"
                onClick={stopAndSubmitRecording}
              >
                ■ Stop &amp; Submit Answer
              </button>
            </>
          ) : (
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button
                id="record-answer-btn"
                className="btn btn-primary"
                onClick={startRecording}
                disabled={status === "processing"}
              >
                {status === "processing" ? (
                  <>
                    <span className="spinner" aria-hidden="true" />
                    Processing...
                  </>
                ) : (
                  "● Record Answer"
                )}
              </button>
              <label
                id="upload-audio-label"
                className="btn btn-upload"
                style={{
                  pointerEvents: status === "processing" ? "none" : "auto"
                }}
              >
                ↑ Upload Audio
                <input
                  id="upload-audio-input"
                  accept="audio/*"
                  disabled={status === "processing"}
                  type="file"
                  onChange={(e) => handleUpload(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>
          )}

          {status === "processing" && !transcriptDraft && (
            <p className="notice notice-warning" style={{ fontSize: "0.88rem" }}>
              Transcribing and evaluating your answer — this takes a few seconds…
            </p>
          )}

          {transcriptDraft && (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span className="muted" style={{ fontSize: "0.8rem", fontWeight: 600 }}>
                TRANSCRIPT PREVIEW
              </span>
              <div className="transcript-block">{transcriptDraft}</div>
            </div>
          )}

          {error && (
            <div id="error-message" className="notice notice-error" role="alert">
              {error}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
