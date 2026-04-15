"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Answer, AnswerEvaluation, Question } from "@/lib/types";
import { apiClient, ApiError } from "@/lib/api-client";

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
  const [pendingAnswerIds, setPendingAnswerIds] = useState<string[]>([]);
  
  const [followUpQuestion, setFollowUpQuestion] = useState<string | null>(null);
  const [hasAskedFollowUp, setHasAskedFollowUp] = useState(false);
  const [totalTimeLeft, setTotalTimeLeft] = useState(0);
  
  const globalTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Background poller for pending answers
  useEffect(() => {
    if (pendingAnswerIds.length === 0) return;

    const interval = setInterval(async () => {
      const currentPending = [...pendingAnswerIds];
      const newlyFinished: string[] = [];

      await Promise.all(currentPending.map(async (answerId) => {
        try {
          const statusData = await apiClient.answers.getStatus(answerId);
          if (statusData.status === "EVALUATED") {
            newlyFinished.push(answerId);
            
            // Add to completed answers if not already there
            setAnswers(prev => {
              const alreadyExists = prev.some(a => (a as any).answerId === answerId);
              if (alreadyExists) return prev;
              
              // Find the original question for this answer
              // In a real app we might need to store more metadata when uploading
              return [...prev, {
                answerId,
                questionId: (statusData as any).questionId,
                question: (statusData as any).questionPrompt,
                transcript: statusData.transcript || "",
                evaluation: statusData.evaluation
              }];
            });
          } else if (statusData.status === "FAILED") {
            newlyFinished.push(answerId);
            console.error(`Processing failed for answer ${answerId}`);
          }
        } catch (e) {
          // Silent retry
        }
      }));

      if (newlyFinished.length > 0) {
        setPendingAnswerIds(prev => prev.filter(id => !newlyFinished.includes(id)));
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [pendingAnswerIds]);

  const startGlobalTimer = useCallback((initialTime: number, sessionId?: string) => {
    if (globalTimerRef.current) clearInterval(globalTimerRef.current);
    setTotalTimeLeft(initialTime);
    
    let lastHeartbeatTime = Date.now();
    globalTimerRef.current = setInterval(() => {
      const now = Date.now();
      
      setTotalTimeLeft((prev) => {
        if (prev <= 1) {
          if (globalTimerRef.current) clearInterval(globalTimerRef.current);
          setPhase("complete");
          return 0;
        }

        // Heartbeat every 10 seconds of wall-clock time
        if (now - lastHeartbeatTime >= 10000 && sessionId) {
          apiClient.interviews.postHeartbeat(sessionId, 10).catch(() => {
            /* Silent fail for heartbeat */
          });
          lastHeartbeatTime = now;
        }

        return prev - 1;
      });
    }, 1000);
  }, []);

  // Initialize and Restore Session
  useEffect(() => {
    async function init() {
      if (!token) {
        setPhase("invalid");
        return;
      }

      try {
        let qSetId: string | null = null;
        let restoredIndex = 0;
        let restoredPhase: Phase = "consent";
        let consentAcceptedAt: string | null = null;
        let activeSecondsSpent = 0;
        let currentSessionId = "";
        
        try {
          const sData = await apiClient.interviews.getInvite(token);
          if (sData.session) {
            setSession(sData.session);
            currentSessionId = sData.session.id;
            qSetId = sData.session.questionSetId;
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
        } catch (e) {
          setPhase("invalid");
          return;
        }
        
        if (!qSetId) {
          setPhase("invalid");
          return;
        }

        try {
          const qData = await apiClient.questions.list(qSetId);
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
        } catch (e) {
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
      apiClient.interviews.postConsent(session.id).catch(console.error);
    }

    const totalDuration = (questions || []).reduce((acc, q) => acc + (q?.maxDurationSeconds || 90), 0);
    startGlobalTimer(totalDuration, session?.id);
    setPhase("interview");
  }, [questions, session?.id, startGlobalTimer]);

  const submitAnswer = useCallback(async (audioBlob: Blob) => {
    if (!currentQuestion || !session?.id) return;
    
    setStatus("processing");
    setProcessingStep("Uploading...");
    setProcessingProgress(20);
    setError("");

    try {
      const form = new FormData();
      form.append("audio", audioBlob, "answer.webm");
      form.append("sessionId", session.id);
      form.append("questionId", currentQuestion.id);
      form.append("question", currentQuestion.prompt);
      form.append("competencyTags", JSON.stringify("competencyTags" in currentQuestion ? currentQuestion.competencyTags : []));

      const uploadData = await apiClient.answers.upload(form, (pct) => {
        setProcessingProgress(pct);
      });
      const answerId = uploadData.answerId;

      setPendingAnswerIds(prev => [...prev, answerId]);
      
      // We also add a optimistic answer entry so we can keep track of count
      setAnswers(prev => [...prev, {
        answerId,
        questionId: currentQuestion.id,
        question: currentQuestion.prompt,
        transcript: "",
        evaluation: null as any
      }]);

      setProcessingProgress(100);
      setProcessingStep("Uploaded.");

      // Reset follow-up state (we can't do follow-ups synchronously anymore 
      // without blocking, so we either skip or handle them differently)
      setFollowUpQuestion(null);
      setHasAskedFollowUp(false);

      if (questionIndex === questions.length - 1) {
        // Even if some are pending, we allow the candidate to finish
        if (session.id) {
          apiClient.interviews.postComplete(session.id).catch(console.error);
        }

        if (globalTimerRef.current) clearInterval(globalTimerRef.current);
        setPhase("complete");
      } else {
        setQuestionIndex((i) => i + 1);
        setStatus("idle");
      }
    } catch (err) {
      console.error("Answer upload failed:", err);
      setError(err instanceof ApiError ? err.message : "Failed to upload answer.");
      setStatus("error");
    }
  }, [currentQuestion, session, questionIndex, questions.length]);

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
