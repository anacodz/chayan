import { Inngest } from "inngest";
import { transcribeAudioService, orchestrateEvaluation, evaluateAnswerService } from "./services/ai";
import prisma from "./prisma";
import { logger } from "./logger";
import { monitoring } from "./monitoring";
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
      try {
        const audioRes = await fetch(audioUrl);
        const audioBlob = await audioRes.blob();
        
        return await transcribeAudioService(audioBlob);
      } catch (error) {
        monitoring.captureException(error, { answerId, sessionId, step: "transcribe-audio" });
        throw error; // Let Inngest retry
      }
    });

    // 2. Save transcript to database and handle quality
    const shouldEvaluate = await step.run("save-transcript-and-check-quality", async () => {
      logger.info({ answerId, quality: transcriptionResult.quality }, "Saving transcript");
      
      try {
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
      } catch (error) {
        monitoring.captureException(error, { answerId, sessionId, step: "save-transcript" });
        throw error;
      }
    });

    if (!shouldEvaluate) {
      return { answerId, status: "needs_retry", quality: transcriptionResult.quality };
    }

    // 3. Evaluate transcript and orchestrate DB payload
    const evaluationData = await step.run("evaluate-answer", async () => {
      logger.info({ answerId }, "Evaluating transcript and orchestrating payload");
      try {
        return await orchestrateEvaluation(question, transcriptionResult.text, competencyTags, answerId);
      } catch (error) {
        monitoring.captureException(error, { answerId, sessionId, step: "evaluate-answer" });
        throw error;
      }
    });

    const { evaluation, dbPayload } = evaluationData;

    // 4. Save evaluation and update answer status
    await step.run("save-evaluation", async () => {
      logger.info({ answerId }, "Saving evaluation to database");
      try {
        await prisma.answerEvaluation.upsert({
          where: { answerId },
          create: dbPayload,
          update: dbPayload,
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
      } catch (error) {
        monitoring.captureException(error, { answerId, sessionId, step: "save-evaluation" });
        throw error;
      }
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
      logger.info({ sessionId }, "Fetching all answers for final report");
      try {
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
      } catch (error) {
        monitoring.captureException(error, { sessionId, step: "fetch-all-answers" });
        throw error;
      }
    });

    const reportData = await step.run("generate-final-report", async () => {
      logger.info({ sessionId }, "Generating final report using AI");
      try {
        const { GoogleGenAI } = await import("@google/genai");
        const { FinalReportSchema } = await import("./schemas");
        const { extractJsonObject } = await import("./json");
        const { fallbackSummarize } = await import("./evaluation");
        const { withRetry } = await import("./retry");

        if (!env.GEMINI_API_KEY) {
          logger.warn({ sessionId }, "GEMINI_API_KEY not found, using fallback summarization");
          return { report: fallbackSummarize(answers as any), usage: undefined };
        }

        const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
        const modelName = "gemini-1.5-pro"; 
        const model = ai.getGenerativeModel({ model: modelName });

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

        const result = await withRetry(async () => {
          return await model.generateContent(prompt);
        });

        const response = await result.response;
        const text = response.text() || "";
        const rawJson = extractJsonObject<any>(text);
        const report = FinalReportSchema.parse(rawJson);
        
        return {
          report,
          usage: response.usageMetadata ? {
            inputTokens: response.usageMetadata.promptTokenCount,
            outputTokens: response.usageMetadata.candidatesTokenCount
          } : undefined
        };
      } catch (error) {
        monitoring.captureException(error, { sessionId, step: "generate-final-report" });
        throw error;
      }
    });

    await step.run("save-final-report", async () => {
      logger.info({ sessionId }, "Saving final report to database");
      try {
        const { report, usage } = reportData;
        const averageScore = (scores: any) => {
          const vals = Object.values(scores) as number[];
          return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
        };

        const data = {
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
          inputTokens: usage?.inputTokens,
          outputTokens: usage?.outputTokens,
          // Gemini 1.5 Pro: $1.25 / 1M input, $5.00 / 1M output (rough estimate for under 128k context)
          costUSD: usage 
            ? (usage.inputTokens * 1.25 + usage.outputTokens * 5.00) / 1_000_000
            : null,
        };

        await prisma.finalReport.upsert({
          where: { sessionId },
          create: data,
          update: data
        });

        await prisma.interviewSession.update({
          where: { id: sessionId },
          data: { status: "COMPLETED", completedAt: new Date() }
        });
      } catch (error) {
        monitoring.captureException(error, { sessionId, step: "save-final-report" });
        throw error;
      }
    });

    return { sessionId, status: "completed" };
  }
);

/**
 * Automated cron job to audit AI model accuracy against calibration samples.
 * Runs weekly on Sunday at 1 AM.
 */
export const calibrationAudit = inngest.createFunction(
  {
    id: "calibration-audit",
    triggers: [{ cron: "0 1 * * 0" }],
  },
  async ({ step }) => {
    const { getCalibrationSamples, updateCalibrationTimestamp } = await import("./services/calibration");
    
    const samples = await step.run("fetch-calibration-samples", async () => {
      return await getCalibrationSamples();
    });

    if (samples.length === 0) {
      return { audited: 0, message: "No calibration samples found" };
    }

    const auditResults = [];

    for (const sample of samples) {
      const result = await step.run(`audit-sample-${sample.id}`, async () => {
        logger.info({ sampleId: sample.id }, "Auditing calibration sample");
        
        const evaluation = await evaluateAnswerService(
          sample.question.prompt,
          sample.transcript,
          sample.question.competencyTags
        );

        const dimensions = [
          "communicationClarity",
          "conceptExplanation",
          "empathyAndPatience",
          "adaptability",
          "professionalism",
          "englishFluency",
        ];

        const variances = dimensions.map(dim => {
          const expected = (sample as any)[dim] as number;
          const actual = Math.round((evaluation.dimensionScores as any)[dim] as number);
          const delta = Math.abs(expected - actual);
          
          if (delta > 1.5) {
            logger.error(
              { sampleId: sample.id, dimension: dim, expected, actual, delta },
              "AI Calibration Drift Detected: Variance exceeds threshold"
            );
          }

          return { dim, expected, actual, delta };
        });

        await updateCalibrationTimestamp(sample.id);

        return {
          sampleId: sample.id,
          variances,
          avgDelta: variances.reduce((acc, v) => acc + v.delta, 0) / variances.length,
        };
      });

      auditResults.push(result);
    }

    return { 
      audited: samples.length,
      results: auditResults,
    };
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

    const abandonedCount = await step.run("mark-abandoned-sessions", async () => {
      const result = await prisma.interviewSession.updateMany({
        where: {
          status: { in: ["INVITED", "CONSENTED", "IN_PROGRESS"] },
          updatedAt: { lt: abandonmentLimit },
        },
        data: { status: "ABANDONED" },
      });
      logger.info({ count: result.count }, "Marked abandoned sessions");
      return result.count;
    });

    return { 
      audioDeleted: oldAnswers.length,
      sessionsAbandoned: abandonedCount
    };
  }
);
