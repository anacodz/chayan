import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { fallbackSummarize } from "@/lib/evaluation";
import { extractJsonObject } from "@/lib/json";
import { env } from "@/lib/env";
import { withRetry } from "@/lib/retry";
import prisma from "@/lib/prisma";
import type { AnswerEvaluation, FinalReport } from "@/lib/types";

export const runtime = "nodejs";

type SubmittedAnswer = {
  questionId: string;
  question: string;
  transcript: string;
  evaluation: AnswerEvaluation;
};

export async function POST(request: Request) {
  const body = await request.json();
  const answers = Array.isArray(body.answers) ? (body.answers as SubmittedAnswer[]) : [];
  const sessionId = body.sessionId as string | undefined;

  if (answers.length === 0) {
    return NextResponse.json({ error: "At least one evaluated answer is required." }, { status: 400 });
  }

  let report: FinalReport;
  let provider: string;

  if (!env.GEMINI_API_KEY) {
    report = fallbackSummarize(answers);
    provider = "local";
  } else {
    try {
      const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
      const response = await withRetry(async () => {
        return await ai.models.generateContent({
          model: "gemini-2.0-flash",
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

      report = extractJsonObject<FinalReport>(response.text || "");
      provider = "gemini";
    } catch (error) {
      console.error("Summarization error:", error);
      report = fallbackSummarize(answers);
      provider = "local-fallback";
    }
  }

  // Save to database if sessionId is provided
  if (sessionId) {
    try {
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
            rationale: a.evaluation.reasoning
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
            rationale: a.evaluation.reasoning
          })),
        }
      });

      await prisma.interviewSession.update({
        where: { id: sessionId },
        data: { status: "COMPLETED", completedAt: new Date() }
      });
    } catch (dbError) {
      console.error("Failed to save report to database:", dbError);
    }
  }

  return NextResponse.json({ report, provider });
}

function averageScore(scores: Record<string, number>): number {
  const vals = Object.values(scores) as number[];
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
}
