import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { fallbackEvaluate } from "@/lib/evaluation";
import { extractJsonObject } from "@/lib/json";
import { env } from "@/lib/env";
import { withRetry } from "@/lib/retry";
import prisma from "@/lib/prisma";
import type { AnswerEvaluation } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json();
  const question = String(body.question || "");
  const transcript = String(body.transcript || "");
  const competencyTags = Array.isArray(body.competencyTags) ? body.competencyTags : [];
  const sessionId = body.sessionId as string | undefined;
  const questionId = body.questionId as string | undefined;
  const audioUrl = body.audioUrl as string | undefined;

  if (!question || !transcript.trim()) {
    return NextResponse.json({ error: "Question and transcript are required." }, { status: 400 });
  }

  let evaluation: AnswerEvaluation;
  let provider: string;

  if (!env.GEMINI_API_KEY) {
    evaluation = fallbackEvaluate(transcript);
    provider = "local";
  } else {
    try {
      const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
      const response = await withRetry(async () => {
        return await ai.models.generateContent({
          model: "gemini-2.0-flash",
          contents: `Evaluate this tutor screening answer.

Question: ${question}
Competency tags: ${competencyTags.join(", ")}
Transcript: ${transcript}

Return JSON only with this shape:
{
  "score": number,
  "reasoning": string,
  "signals": string[],
  "redFlags": string[],
  "dimensionScores": {
    "communicationClarity": number,
    "conceptExplanation": number,
    "empathyAndPatience": number,
    "adaptability": number,
    "professionalism": number,
    "englishFluency": number
  },
  "confidence": number,
  "followUpQuestion": string | null
}

Scores must be 1 to 5. Confidence must be 0 to 1. Ground every judgment in the transcript.
If the answer is too short, vague, or missing key competency signals, provide a short, targeted follow-up question in "followUpQuestion". Otherwise, set it to null.`
        });
      });

      evaluation = extractJsonObject<AnswerEvaluation>(response.text || "");
      provider = "gemini";
    } catch (error) {
      console.error("Evaluation error:", error);
      evaluation = fallbackEvaluate(transcript);
      provider = "local-fallback";
    }
  }

  // Save to database if sessionId and questionId are provided
  if (sessionId && questionId) {
    try {
      const answer = await prisma.answer.create({
        data: {
          sessionId,
          questionId,
          audioObjectKey: audioUrl || "local-demo",
          status: "EVALUATED",
          transcript: {
            create: {
              provider: "sarvam", // Simplified for now
              model: "saaras:v3",
              text: transcript,
              latencyMs: 0,
            }
          },
          evaluation: {
            create: {
              model: "gemini-2.0-flash",
              promptVersion: "1.0",
              schemaVersion: "1.0",
              transcriptHash: "hash", // Placeholder
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
      console.error("Failed to save answer to database:", dbError);
    }
  }

  return NextResponse.json({ evaluation, provider });
}
