import { Inngest } from "inngest";
import { transcribeAudioService, evaluateAnswerService } from "./services/ai";
import prisma from "./prisma";
import { logger } from "./logger";
import { createHash } from "node:crypto";
import { env } from "./env";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "chayan" });

/**
 * Background job to transcribe and evaluate an answer.
 * Triggers on 'answer/uploaded' event.
 */
export const transcribeAndEvaluateAnswer = inngest.createFunction(
  {
    id: "transcribe-and-evaluate-answer",
    triggers: [{ event: "answer/uploaded" }],
  },
  async ({ event, step }) => {
    const { answerId, sessionId, questionId, audioUrl, question, competencyTags } = event.data;
    
    logger.info({ answerId, sessionId }, "Starting background processing for answer");

    // 1. Transcribe audio
    const transcriptionResult = await step.run("transcribe-audio", async () => {
      logger.info({ answerId }, "Transcribing audio");
      const audioRes = await fetch(audioUrl);
      const audioBlob = await audioRes.blob();
      
      return await transcribeAudioService(audioBlob);
    });

    // 2. Save transcript to database and handle quality
    const shouldEvaluate = await step.run("save-transcript-and-check-quality", async () => {
      logger.info({ answerId, quality: transcriptionResult.quality }, "Saving transcript");
      
      await prisma.transcript.upsert({
        where: { answerId },
        create: {
          answerId,
          provider: transcriptionResult.provider as any,
          model: transcriptionResult.model,
          text: transcriptionResult.text,
          latencyMs: 0,
        },
        update: {
          provider: transcriptionResult.provider as any,
          model: transcriptionResult.model,
          text: transcriptionResult.text,
          latencyMs: 0,
        }
      });

      if (transcriptionResult.quality !== "OK") {
        await prisma.answer.update({
          where: { id: answerId },
          data: { status: "NEEDS_RETRY" }
        });
        
        await prisma.interviewSession.update({
          where: { id: sessionId },
          data: { status: "NEEDS_CANDIDATE_RETRY" }
        });
        
        return false;
      }

      await prisma.answer.update({
        where: { id: answerId },
        data: { status: "TRANSCRIBED" }
      });
      return true;
    });

    if (!shouldEvaluate) {
      return { answerId, status: "needs_retry", quality: transcriptionResult.quality };
    }

    // 3. Evaluate transcript
    const evaluation = await step.run("evaluate-answer", async () => {
      logger.info({ answerId }, "Evaluating transcript");
      return await evaluateAnswerService(question, transcriptionResult.text, competencyTags);
    });

    // 4. Save evaluation and update answer status
    await step.run("save-evaluation", async () => {
      logger.info({ answerId }, "Saving evaluation");
      const transcriptHash = createHash("sha256")
        .update(transcriptionResult.text)
        .digest("hex");

      await prisma.answerEvaluation.upsert({
        where: { answerId },
        create: {
          answerId,
          modelProvider: "google",
          model: "gemini-2.0-flash",
          promptVersion: "v1",
          schemaVersion: "v1",
          transcriptHash,
          communicationClarity: Math.round(evaluation.dimensionScores.communicationClarity),
          conceptExplanation: Math.round(evaluation.dimensionScores.conceptExplanation),
          empathyAndPatience: Math.round(evaluation.dimensionScores.empathyAndPatience),
          adaptability: Math.round(evaluation.dimensionScores.adaptability),
          professionalism: Math.round(evaluation.dimensionScores.professionalism),
          englishFluency: Math.round(evaluation.dimensionScores.englishFluency),
          confidence: evaluation.confidence,
          evidence: evaluation.signals,
          concerns: evaluation.redFlags,
          followUpQuestion: evaluation.followUpQuestion ?? null,
          requiresHumanReview: false,
        },
        update: {
          modelProvider: "google",
          model: "gemini-2.0-flash",
          promptVersion: "v1",
          schemaVersion: "v1",
          transcriptHash,
          communicationClarity: Math.round(evaluation.dimensionScores.communicationClarity),
          conceptExplanation: Math.round(evaluation.dimensionScores.conceptExplanation),
          empathyAndPatience: Math.round(evaluation.dimensionScores.empathyAndPatience),
          adaptability: Math.round(evaluation.dimensionScores.adaptability),
          professionalism: Math.round(evaluation.dimensionScores.professionalism),
          englishFluency: Math.round(evaluation.dimensionScores.englishFluency),
          confidence: evaluation.confidence,
          evidence: evaluation.signals,
          concerns: evaluation.redFlags,
          followUpQuestion: evaluation.followUpQuestion ?? null,
          requiresHumanReview: false,
        },
      });

      await prisma.answer.update({
        where: { id: answerId },
        data: { status: "EVALUATED" },
      });

      await prisma.interviewSession.update({
        where: { id: sessionId },
        data: {
          status: evaluation.followUpQuestion
            ? "NEEDS_CANDIDATE_RETRY"
            : "READY_FOR_NEXT_QUESTION",
        },
      });
    });

    return { answerId, status: "completed" };
  }
);

/**
 * Background job to synthesize final assessment report.
 * Triggers on 'interview/completed' event.
 */
export const finalizeInterviewReport = inngest.createFunction(
  {
    id: "finalize-interview-report",
    triggers: [{ event: "interview/completed" }],
  },
  async ({ event, step }) => {
    const { sessionId } = event.data;
    
    logger.info({ sessionId }, "Starting background report generation");

    const answers = await step.run("fetch-all-answers", async () => {
      const answersData = await prisma.answer.findMany({
        where: { sessionId },
        include: {
          transcript: true,
          evaluation: true,
          question: true,
        },
        orderBy: { createdAt: "asc" },
      });
      
      return answersData.map(a => ({
        questionId: a.questionId,
        question: a.question.prompt,
        transcript: a.transcript?.text || "",
        evaluation: a.evaluation ? {
          reasoning: a.evaluation.evidence.join(". "),
          dimensionScores: {
            communicationClarity: a.evaluation.communicationClarity,
            conceptExplanation: a.evaluation.conceptExplanation,
            empathyAndPatience: a.evaluation.empathyAndPatience,
            adaptability: a.evaluation.adaptability,
            professionalism: a.evaluation.professionalism,
            englishFluency: a.evaluation.englishFluency,
          }
        } : null
      }));
    });

    const report = await step.run("generate-final-report", async () => {
      const { GoogleGenAI } = await import("@google/genai");
      const { FinalReportSchema } = await import("./schemas");
      const { extractJsonObject } = await import("./json");
      const { fallbackSummarize } = await import("./evaluation");
      const { withRetry } = await import("./retry");

      if (!env.GEMINI_API_KEY) {
        return fallbackSummarize(answers as any);
      }

      const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
      const modelName = "gemini-1.5-pro"; 

      const prompt = `Create a high-fidelity final tutor screening report from these structured answers.

Candidate Data: ${JSON.stringify(answers, null, 2)}

Return JSON only with this shape:
{
  "recommendation": "MOVE_FORWARD" | "HOLD" | "DECLINE",
  "summary": string,
  "dimensionScores": {
    "communicationClarity": number,
    "conceptExplanation": number,
    "empathyAndPatience": number,
    "adaptability": number,
    "professionalism": number,
    "englishFluency": number
  },
  "strengths": string[],
  "concerns": string[],
  "nextStep": string,
  "confidence": number
}

Use only evidence from the transcripts. Scores should be 1-5. Confidence 0-1. Be critical but fair.`;

      const response = await withRetry(async () => {
        return await ai.models.generateContent({
          model: modelName,
          contents: prompt
        });
      });

      const text = response.text || "";
      const rawJson = extractJsonObject<any>(text);
      return FinalReportSchema.parse(rawJson);
    });

    await step.run("save-final-report", async () => {
      const averageScore = (scores: any) => {
        const vals = Object.values(scores) as number[];
        return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
      };

      await prisma.finalReport.upsert({
        where: { sessionId },
        create: {
          sessionId,
          recommendation: report.recommendation as any,
          overallScore: averageScore(report.dimensionScores),
          confidence: report.confidence || 0.8,
          strengths: report.strengths,
          risks: report.concerns,
          suggestedFollowUps: [report.nextStep],
          evidenceByQuestion: answers.map(a => ({
            questionId: a.questionId,
            transcriptExcerpt: a.transcript.slice(0, 100),
            rationale: "Evaluated in context of whole interview."
          })),
          model: "gemini-1.5-pro",
          promptVersion: "v1",
          schemaVersion: "v1",
        },
        update: {
          recommendation: report.recommendation as any,
          overallScore: averageScore(report.dimensionScores),
          strengths: report.strengths,
          risks: report.concerns,
        }
      });

      await prisma.interviewSession.update({
        where: { id: sessionId },
        data: { status: "COMPLETED", completedAt: new Date() }
      });
    });

    return { sessionId, status: "completed" };
  }
);

/**
 * Automated cron job to clean up old data.
 * Runs daily at midnight.
 */
export const cleanupOldData = inngest.createFunction(
  {
    id: "cleanup-old-data",
    triggers: [{ cron: "0 0 * * *" }],
  },
  async ({ step }) => {
    // 1. Delete audio older than 90 days
    const audioRetentionLimit = new Date();
    audioRetentionLimit.setDate(audioRetentionLimit.getDate() - 90);

    const oldAnswers = await step.run("fetch-old-answers", async () => {
      return await prisma.answer.findMany({
        where: {
          createdAt: { lt: audioRetentionLimit },
          audioObjectKey: { startsWith: "http" }, // Only delete remote blobs
        },
        select: { id: true, audioObjectKey: true },
      });
    });

    if (oldAnswers.length > 0) {
      await step.run("delete-old-audio", async () => {
        const { deleteAudio } = await import("./storage");
        for (const answer of oldAnswers) {
          try {
            await deleteAudio(answer.audioObjectKey);
            // Update record to indicate audio was deleted
            await prisma.answer.update({
              where: { id: answer.id },
              data: { audioObjectKey: "deleted-by-retention-policy" },
            });
          } catch (e) {
            logger.error({ answerId: answer.id, url: answer.audioObjectKey }, "Failed to delete old audio");
          }
        }
      });
    }

    // 2. Mark abandoned sessions (no activity for 24 hours)
    const abandonmentLimit = new Date();
    abandonmentLimit.setHours(abandonmentLimit.getHours() - 24);

    await step.run("mark-abandoned-sessions", async () => {
      const result = await prisma.interviewSession.updateMany({
        where: {
          status: { in: ["INVITED", "CONSENTED", "IN_PROGRESS"] },
          updatedAt: { lt: abandonmentLimit },
        },
        data: { status: "ABANDONED" },
      });
      return { markedAbandoned: result.count };
    });

    return { 
      audioDeleted: oldAnswers.length,
    };
  }
);
