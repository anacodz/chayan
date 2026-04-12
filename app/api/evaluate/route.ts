import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { fallbackEvaluate } from "@/lib/evaluation";
import { extractJsonObject } from "@/lib/json";
import { env } from "@/lib/env";
import { withRetry } from "@/lib/retry";
import type { AnswerEvaluation } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json();
  const question = String(body.question || "");
  const transcript = String(body.transcript || "");
  const competencyTags = Array.isArray(body.competencyTags) ? body.competencyTags : [];

  if (!question || !transcript.trim()) {
    return NextResponse.json({ error: "Question and transcript are required." }, { status: 400 });
  }

  if (!env.GEMINI_API_KEY) {
    return NextResponse.json({ evaluation: fallbackEvaluate(transcript), provider: "local" });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

    const response = await withRetry(async () => {
      const res = await ai.models.generateContent({
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
      return res;
    });

    return NextResponse.json({
      evaluation: extractJsonObject<AnswerEvaluation>(response.text || ""),
      provider: "gemini"
    });
  } catch (error) {
    console.error("Evaluation error:", error);
    return NextResponse.json({ evaluation: fallbackEvaluate(transcript), provider: "local-fallback" });
  }
}
