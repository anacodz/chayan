"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Answer, AnswerEvaluation, Question } from "@/lib/types";

export type Phase = "loading" | "invalid" | "consent" | "interview" | "complete" | "security_violation";

interface UseInterviewSessionOptions {
  token: string | null;
  onSecurityViolation: (type: string) => void;
}

export function useInterviewSession({ token }: UseInterviewSessionOptions) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [session, setSession] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [status, setStatus] = useState<"idle" | "processing" | "error" | "needs_retry">("idle");
  const [processingStep, setProcessingStep] = useState("");
  const [processingProgress, setProcessingProgress] = useState(0);
  const [error, setError] = useState("");
  
  const [followUpQuestion, setFollowUpQuestion] = useState<string | null>(null);
  const [hasAskedFollowUp, setHasAskedFollowUp] = useState(false);
  const [totalTimeLeft, setTotalTimeLeft] = useState(0);
  
  const globalTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startGlobalTimer = useCallback((initialTime: number, sessionId?: string) => {
    if (globalTimerRef.current) clearInterval(globalTimerRef.current);
    setTotalTimeLeft(initialTime);
    
    let tickCount = 0;
    globalTimerRef.current = setInterval(() => {
      setTotalTimeLeft((prev) => {
        if (prev <= 1) {
          if (globalTimerRef.current) clearInterval(globalTimerRef.current);
          setPhase("complete");
          return 0;
        }

        // Heartbeat every 10 seconds
        tickCount++;
        if (tickCount >= 10 && sessionId) {
          fetch(`/api/interviews/${sessionId}/heartbeat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ secondsToAdd: 10 }),
          }).catch(console.error);
          tickCount = 0;
        }

        return prev - 1;
      });
    }, 1000);
  }, []);

  // Initialize and Restore Session
  useEffect(() => {
    async function init() {
      try {
        let qSetId = "default";
        let restoredIndex = 0;
        let restoredPhase: Phase = "consent";
        let consentAcceptedAt: string | null = null;
        let activeSecondsSpent = 0;
        let currentSessionId = "";
        
        if (token) {
          const sRes = await fetch(`/api/invites/${token}`);
          if (sRes.ok) {
            const sData = await sRes.json();
            if (sData.session) {
              setSession(sData.session);
              currentSessionId = sData.session.id;
              qSetId = sData.session.questionSetId || "default";
              consentAcceptedAt = sData.session.consentAcceptedAt;
              activeSecondsSpent = sData.session.activeSecondsSpent || 0;
              
              if (sData.session.status === "COMPLETED") {
                restoredPhase = "complete";
              } else if (sData.session.answers?.length > 0) {
                const restoredAnswers = sData.session.answers.map((a: any) => ({
                  questionId: a.questionId,
                  question: a.question.prompt,
                  transcript: a.transcript?.text || "",
                  evaluation: a.evaluation ? {
                    score: (a.evaluation.communicationClarity + a.evaluation.conceptExplanation + a.evaluation.empathyAndPatience) / 3,
                    reasoning: "Restored from database.",
                    signals: a.evaluation.evidence,
                    redFlags: a.evaluation.concerns,
                    dimensionScores: {
                      communicationClarity: a.evaluation.communicationClarity,
                      conceptExplanation: a.evaluation.conceptExplanation,
                      empathyAndPatience: a.evaluation.empathyAndPatience,
                      adaptability: a.evaluation.adaptability,
                      professionalism: a.evaluation.professionalism,
                      englishFluency: a.evaluation.englishFluency,
                    },
                    confidence: a.evaluation.confidence,
                    followUpQuestion: a.evaluation.followUpQuestion,
                  } : null
                })).filter((a: any) => a.evaluation !== null);

                setAnswers(restoredAnswers);
                
                const mainQuestionIdsDone = new Set();
                let lastEvaluation: any = null;
                
                restoredAnswers.forEach((a: any) => {
                  const baseId = a.questionId.startsWith("follow-up-") 
                    ? a.questionId.replace("follow-up-", "") 
                    : a.questionId;
                  
                  if (!a.questionId.startsWith("follow-up-")) {
                    mainQuestionIdsDone.add(baseId);
                    lastEvaluation = a.evaluation;
                  } else {
                    mainQuestionIdsDone.add(baseId);
                    lastEvaluation = null; 
                  }
                });

                restoredIndex = mainQuestionIdsDone.size;
                
                if (lastEvaluation?.followUpQuestion) {
                  setFollowUpQuestion(lastEvaluation.followUpQuestion);
                  setHasAskedFollowUp(true);
                  restoredIndex = Math.max(0, restoredIndex - 1);
                }

                restoredPhase = "interview";
              }
            }
          }
        }
        
        const qRes = await fetch(`/api/questions?questionSetId=${qSetId}`);
        if (qRes.ok) {
          const qData = await qRes.json();
          const fetchedQuestions = qData.questions || [];
          setQuestions(fetchedQuestions);
          
          if (restoredIndex >= fetchedQuestions.length && fetchedQuestions.length > 0) {
            setPhase("complete");
          } else {
            setQuestionIndex(restoredIndex);
            
            if (consentAcceptedAt) {
              const totalDuration = (fetchedQuestions || []).reduce((acc: number, q: any) => acc + (q?.maxDurationSeconds || 90), 0);
              const timeLeft = Math.max(0, totalDuration - activeSecondsSpent);
              
              setTotalTimeLeft(timeLeft);
              if (restoredPhase === "interview") {
                startGlobalTimer(timeLeft, currentSessionId);
              }
            }
            setPhase(restoredPhase);
          }
        } else {
          setPhase("invalid");
        }
      } catch (err) {
        console.error("Session initialization failed:", err);
        setPhase("invalid");
      }
    }
    init();
  }, [token, startGlobalTimer]);

  const currentQuestion = useMemo(() => {
    if (!questions || questions.length === 0) return null;
    if (followUpQuestion) {
      return { 
        id: `follow-up-${questions[questionIndex]?.id || "fup"}`, 
        prompt: followUpQuestion, 
        guidance: "This is a follow-up question based on your previous response.",
        competencyTags: questions[questionIndex]?.competencyTags || [],
        maxDurationSeconds: 60
      };
    }
    return questions[questionIndex];
  }, [questions, questionIndex, followUpQuestion]);

  const startAssessment = useCallback(async () => {
    if (session?.id) {
      try {
        await fetch(`/api/interviews/${session.id}/consent`, {
          method: "POST",
        });
      } catch (err) {
        console.error("Failed to record consent:", err);
      }
    }

    const totalDuration = (questions || []).reduce((acc, q) => acc + (q?.maxDurationSeconds || 90), 0);
    startGlobalTimer(totalDuration, session?.id);
    setPhase("interview");
  }, [questions, session?.id, startGlobalTimer]);

  const submitAnswer = useCallback(async (audioBlob: Blob) => {
    if (!currentQuestion) return;
    
    setStatus("processing");
    setProcessingStep("Preparing upload...");
    setProcessingProgress(5);
    setError("");

    try {
      const form = new FormData();
      form.append("audio", audioBlob, "answer.webm");
      form.append("sessionId", session?.id || "demo");
      form.append("questionId", currentQuestion.id);
      form.append("question", currentQuestion.prompt);
      form.append("competencyTags", JSON.stringify("competencyTags" in currentQuestion ? currentQuestion.competencyTags : []));

      setProcessingStep("Uploading voice recording...");
      setProcessingProgress(25);
      const uploadRes = await fetch("/api/answers/upload", { method: "POST", body: form });
      if (!uploadRes.ok) throw new Error("Upload failed. Please try again.");
      
      const uploadData = await uploadRes.json();
      const answerId = uploadData.answerId;

      let evaluation: AnswerEvaluation | null = null;
      let transcript = "";
      
      setProcessingStep("Voice uploaded. Transcribing...");
      setProcessingProgress(50);

      // Polling for evaluation with progressive percentage updates
      for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const statusRes = await fetch(`/api/answers/${answerId}/status`);
        const statusData = await statusRes.json();
        
        if (statusData.status === "TRANSCRIBED") {
          setProcessingStep("Evaluation in progress...");
          setProcessingProgress(75);
        } else if (statusData.status === "EVALUATED") {
          setProcessingStep("Finished.");
          setProcessingProgress(100);
          evaluation = statusData.evaluation;
          transcript = statusData.transcript;
          break;
        } else if (statusData.status === "NEEDS_RETRY") {
          setStatus("needs_retry" as any);
          setError("Your response was too short or unclear. Please provide a more detailed explanation.");
          return;
        } else if (statusData.status === "FAILED") {
          throw new Error("AI processing failed. Please try again.");
        }
        
        // Minor incremental updates to keep it "alive" during long waits
        if (statusData.status === "UPLOADED" && i > 5) {
          const fakeProgress = Math.min(50 + (i * 1), 74);
          setProcessingProgress(fakeProgress);
          setProcessingStep("Transcribing voice...");
        } else if (statusData.status === "TRANSCRIBED" && i > 5) {
          const fakeProgress = Math.min(75 + (i * 0.5), 98);
          setProcessingProgress(fakeProgress);
          setProcessingStep("Running AI evaluation...");
        }
      }

      if (!evaluation) {
        setStatus("error");
        setError("Evaluation timed out. Please try again.");
        return;
      }

      const nextAnswers = [...answers, { 
        questionId: currentQuestion.id, 
        question: currentQuestion.prompt, 
        transcript, 
        evaluation 
      }];
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
        // Build final report
        await fetch("/api/summarize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers: nextAnswers, sessionId: session?.id }),
        });

        // Mark interview as complete in database
        if (session?.id) {
          try {
            await fetch(`/api/interviews/${session.id}/complete`, {
              method: "POST",
            });
          } catch (err) {
            console.error("Failed to mark interview as complete:", err);
          }
        }

        if (globalTimerRef.current) clearInterval(globalTimerRef.current);
        setPhase("complete");
      } else {
        setQuestionIndex((i) => i + 1);
        setStatus("idle");
      }
    } catch (err) {
      console.error("Answer submission failed:", err);
      setError(err instanceof Error ? err.message : "Failed to process answer.");
      setStatus("error" as any);
    }
  }, [currentQuestion, session, answers, hasAskedFollowUp, questionIndex, questions.length, startGlobalTimer]);

  useEffect(() => {
    return () => {
      if (globalTimerRef.current) clearInterval(globalTimerRef.current);
    };
  }, []);

  return {
    phase,
    setPhase,
    session,
    questions,
    questionIndex,
    currentQuestion,
    answers,
    status,
    processingStep,
    processingProgress,
    error,
    totalTimeLeft,
    startAssessment,
    submitAnswer,
    setError,
  };
}
