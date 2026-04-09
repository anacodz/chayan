import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { fallbackSummarize } from "@/lib/evaluation";
import { extractJsonObject } from "@/lib/json";
import type { AnswerEvaluation, FinalReport } from "@/lib/types";

export const runtime = "nodejs";

type SubmittedAnswer = {
  question: string;
  transcript: string;
  evaluation: AnswerEvaluation;
};

export async function POST(request: Request) {
  const body = await request.json();
  const answers = Array.isArray(body.answers) ? (body.answers as SubmittedAnswer[]) : [];

  if (answers.length === 0) {
    return NextResponse.json({ error: "At least one evaluated answer is required." }, { status: 400 });
  }

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ report: fallbackSummarize(answers), provider: "local" });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_POWER_MODEL || "gemini-2.0-flash",
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

    return NextResponse.json({
      report: extractJsonObject<FinalReport>(response.text || ""),
      provider: "gemini"
    });
  } catch {
    return NextResponse.json({ report: fallbackSummarize(answers), provider: "local-fallback" });
  }
}
