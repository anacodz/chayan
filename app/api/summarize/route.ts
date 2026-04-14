import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { fallbackSummarize } from "@/lib/evaluation";
import { extractJsonObject } from "@/lib/json";
import { env } from "@/lib/env";
import { withRetry } from "@/lib/retry";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { v4 as uuidv4 } from "uuid";
import { FinalReportSchema, type FinalReport } from "@/lib/schemas";

export const runtime = "nodejs";

type SubmittedAnswer = {
  questionId: string;
  question: string;
  transcript: string;
  evaluation: any;
};

export async function POST(request: Request) {
  const requestId = uuidv4();
  try {
    const body = await request.json();
    const answers = Array.isArray(body.answers) ? (body.answers as SubmittedAnswer[]) : [];
    const sessionId = body.sessionId as string | undefined;

    if (answers.length === 0) {
      logger.warn({ requestId, sessionId }, "Summarize attempt with no answers");
      return NextResponse.json({ error: "At least one evaluated answer is required." }, { status: 400 });
    }

    logger.info({ requestId, sessionId, answerCount: answers.length }, "Processing summary request");

    let report: FinalReport;
    let provider: string;

    if (!env.GEMINI_API_KEY) {
      logger.info({ requestId, sessionId }, "Using local fallback for summary (no API key)");
      report = fallbackSummarize(answers) as any;
      provider = "local";
    } else {
      try {
        const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
        const response = await withRetry(async () => {
          return await ai.models.generateContent({
            model: "gemini-1.5-pro",
            contents: `Create a final tutor screening report from these answers.

${JSON.stringify(answers, null, 2)}

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
  "nextStep": string
}

Use only transcript evidence. Keep the report recruiter-ready and concise.`
          });
        });

        const text = response.text || "";
        const rawJson = extractJsonObject<any>(text);
        report = FinalReportSchema.parse(rawJson);
        provider = "gemini";
        logger.info({ requestId, sessionId }, "Gemini summary successful");
      } catch (error) {
        logger.error({ requestId, sessionId, error: error instanceof Error ? error.message : "Unknown error" }, "Gemini summary failed, using fallback");
        report = fallbackSummarize(answers) as any;
        provider = "local-fallback";
      }
    }

    // Save to database if sessionId is provided
    if (sessionId) {
      try {
        logger.info({ requestId, sessionId }, "Saving final report to DB");
        await prisma.finalReport.upsert({
          where: { sessionId },
          create: {
            sessionId,
            recommendation: report.recommendation,
            overallScore: averageScore(report.dimensionScores),
            confidence: report.confidence || 0.8,
            strengths: report.strengths,
            risks: report.concerns,
            suggestedFollowUps: [report.nextStep],
            evidenceByQuestion: answers.map(a => ({
              questionId: a.questionId,
              transcriptExcerpt: a.transcript.slice(0, 100),
              rationale: a.evaluation?.reasoning
            })),
            model: "gemini-2.0-flash",
            promptVersion: "1.0",
            schemaVersion: "1.0",
          },
          update: {
            recommendation: report.recommendation,
            overallScore: averageScore(report.dimensionScores),
            strengths: report.strengths,
            risks: report.concerns,
            evidenceByQuestion: answers.map(a => ({
              questionId: a.questionId,
              transcriptExcerpt: a.transcript.slice(0, 100),
              rationale: a.evaluation?.reasoning
            })),
          }
        });

        await prisma.interviewSession.update({
          where: { id: sessionId },
          data: { status: "COMPLETED", completedAt: new Date() }
        });
        logger.info({ requestId, sessionId }, "Report saved and session completed");
      } catch (dbError) {
        logger.error({ requestId, sessionId, error: dbError }, "Failed to save report to DB");
      }
    }

    return NextResponse.json({ report, provider });
  } catch (error) {
    logger.error({ error }, "Summarize route failed");
    return NextResponse.json({ error: "Summarization failed" }, { status: 500 });
  }
}

function averageScore(scores: any): number {
  const vals = Object.values(scores) as number[];
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
}
