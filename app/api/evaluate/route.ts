import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { fallbackEvaluate } from "@/lib/evaluation";
import { extractJsonObject } from "@/lib/json";
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

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ evaluation: fallbackEvaluate(transcript), provider: "local" });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_FAST_MODEL || "gemini-2.0-flash",
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
  "confidence": number
}

Scores must be 1 to 5. Confidence must be 0 to 1. Ground every judgment in the transcript.`
    });

    return NextResponse.json({
      evaluation: extractJsonObject<AnswerEvaluation>(response.text || ""),
      provider: "gemini"
    });
  } catch {
    return NextResponse.json({ evaluation: fallbackEvaluate(transcript), provider: "local-fallback" });
  }
}
