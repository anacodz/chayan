import { NextResponse } from "next/server";
import { evaluateAnswerService } from "@/lib/services/ai";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { v4 as uuidv4 } from "uuid";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const requestId = uuidv4();
  try {
    const body = await request.json();
    const { question, transcript, competencyTags, sessionId, questionId, audioUrl } = body;

    if (!question || !transcript.trim()) {
      logger.warn({ requestId, sessionId }, "Evaluate attempt with missing data");
      return NextResponse.json({ error: "Question and transcript are required." }, { status: 400 });
    }

    logger.info({ requestId, sessionId, questionId }, "Processing evaluation request");

    const evaluation = await evaluateAnswerService(question, transcript, competencyTags);

    // Save to database if sessionId and questionId are provided
    if (sessionId && questionId) {
      try {
        logger.info({ requestId, sessionId, questionId }, "Saving answer and evaluation to DB");
        await prisma.answer.create({
          data: {
            sessionId,
            questionId,
            audioObjectKey: audioUrl || "local-demo",
            status: "EVALUATED",
            transcript: {
              create: {
                provider: "sarvam",
                model: "saaras:v3",
                text: transcript,
                latencyMs: 0,
              }
            },
            evaluation: {
              create: {
                model: evaluation.model,
                promptVersion: evaluation.promptVersion,
                schemaVersion: evaluation.schemaVersion,
                transcriptHash: "hash",
                communicationClarity: evaluation.dimensionScores.communicationClarity,
                conceptExplanation: evaluation.dimensionScores.conceptExplanation,
                empathyAndPatience: evaluation.dimensionScores.empathyAndPatience,
                adaptability: evaluation.dimensionScores.adaptability,
                professionalism: evaluation.dimensionScores.professionalism,
                englishFluency: evaluation.dimensionScores.englishFluency,
                confidence: evaluation.confidence,
                evidence: evaluation.signals,
                concerns: evaluation.redFlags,
                followUpQuestion: evaluation.followUpQuestion,
              }
            }
          }
        });

        await prisma.interviewSession.update({
          where: { id: sessionId },
          data: { status: "IN_PROGRESS" }
        });
      } catch (dbError) {
        logger.error({ requestId, sessionId, error: dbError }, "Failed to save answer to DB");
      }
    }

    logger.info({ requestId, sessionId }, "Evaluation successful");
    return NextResponse.json({ evaluation });
  } catch (error) {
    logger.error({ requestId, error: error instanceof Error ? error.message : "Unknown error" }, "Evaluation route failed");
    return NextResponse.json({ error: "Evaluation failed" }, { status: 500 });
  }
}
