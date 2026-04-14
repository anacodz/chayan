"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Answer, AnswerEvaluation, Question } from "@/lib/types";

interface UseInterviewSessionOptions {
  token: string | null;
  onComplete: () => void;
  onSecurityViolation: (type: string) => void;
}

export function useInterviewSession({ token, onComplete }: UseInterviewSessionOptions) {
  const [session, setSession] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [status, setStatus] = useState<"idle" | "processing" | "error">("idle");
  const [processingStep, setProcessingStep] = useState("");
  const [error, setError] = useState("");
  
  const [followUpQuestion, setFollowUpQuestion] = useState<string | null>(null);
  const [hasAskedFollowUp, setHasAskedFollowUp] = useState(false);
  const [totalTimeLeft, setTotalTimeLeft] = useState(0);
  
  const globalTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize and Restore Session
  useEffect(() => {
    async function init() {
      try {
        let qSetId = "default";
        let restoredIndex = 0;
        
        if (token) {
          const sRes = await fetch(`/api/invites/${token}`);
          if (sRes.ok) {
            const sData = await sRes.json();
            if (sData.session) {
              setSession(sData.session);
              qSetId = sData.session.questionSetId || "default";
              
              if (sData.session.status === "COMPLETED") {
                onComplete();
                return;
              }

              if (sData.session.answers?.length > 0) {
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
                
                // Group logic to find current index
                const mainQuestionIdsDone = new Set();
                let lastEvaluation = null;
                
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
            onComplete();
          } else {
            setQuestionIndex(restoredIndex);
          }
        }
      } catch (err) {
        console.error("Session initialization failed:", err);
        setError("Failed to initialize session.");
      }
    }
    init();
  }, [token, onComplete]);

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

  const startAssessment = useCallback(() => {
    const totalDuration = (questions || []).reduce((acc, q) => acc + (q?.maxDurationSeconds || 90), 0);
    setTotalTimeLeft(totalDuration);
    
    globalTimerRef.current = setInterval(() => {
      setTotalTimeLeft((prev) => {
        if (prev <= 1) {
          if (globalTimerRef.current) clearInterval(globalTimerRef.current);
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [questions, onComplete]);

  const submitAnswer = useCallback(async (audioBlob: Blob) => {
    if (!currentQuestion) return;
    
    setStatus("processing");
    setProcessingStep("Analyzing...");
    setError("");

    try {
      const form = new FormData();
      form.append("audio", audioBlob, "answer.webm");
      form.append("sessionId", session?.id || "demo");
      form.append("questionId", currentQuestion.id);
      form.append("question", currentQuestion.prompt);
      form.append("competencyTags", JSON.stringify("competencyTags" in currentQuestion ? currentQuestion.competencyTags : []));

      const uploadRes = await fetch("/api/answers/upload", { method: "POST", body: form });
      const uploadData = await uploadRes.json();
      const answerId = uploadData.answerId;

      let evaluation: AnswerEvaluation | null = null;
      let transcript = "";
      
      // Polling for evaluation
      for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const statusRes = await fetch(`/api/answers/${answerId}/status`);
        const statusData = await statusRes.json();
        
        if (statusData.status === "EVALUATED") {
          evaluation = statusData.evaluation;
          transcript = statusData.transcript;
          break;
        } else if (statusData.status === "NEEDS_RETRY") {
          throw new Error("Answer too short or unclear. Please try again.");
        }
      }

      if (!evaluation) throw new Error("Evaluation timed out. Please try again.");

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
        if (globalTimerRef.current) clearInterval(globalTimerRef.current);
        onComplete();
      } else {
        setQuestionIndex((i) => i + 1);
        setStatus("idle");
      }
    } catch (err) {
      console.error("Answer submission failed:", err);
      setError(err instanceof Error ? err.message : "Failed to process answer.");
      setStatus("error" as any); // "error" state handled in UI
    }
  }, [currentQuestion, session, answers, hasAskedFollowUp, questionIndex, questions.length, onComplete]);

  useEffect(() => {
    return () => {
      if (globalTimerRef.current) clearInterval(globalTimerRef.current);
    };
  }, []);

  return {
    session,
    questions,
    questionIndex,
    currentQuestion,
    answers,
    status,
    processingStep,
    error,
    totalTimeLeft,
    startAssessment,
    submitAnswer,
    setError,
  };
}
