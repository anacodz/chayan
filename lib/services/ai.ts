import OpenAI from "openai";
import { SarvamAIClient } from "sarvamai";
import { GoogleGenAI } from "@google/genai";
import { env } from "@/lib/env";
import { withRetry } from "@/lib/retry";
import { fallbackEvaluate, fallbackSummarize } from "@/lib/evaluation";
import { extractJsonObject } from "@/lib/json";
import type { AnswerEvaluation, FinalReport } from "@/lib/types";

/**
 * Core transcription logic with Sarvam primary and Whisper fallback.
 */
export async function transcribeAudioService(audioFile: File | Blob): Promise<{ text: string; provider: string; model: string }> {
  if (env.SARVAM_API_KEY) {
    try {
      const client = new SarvamAIClient({
        apiSubscriptionKey: env.SARVAM_API_KEY
      });
      const response = await client.speechToText.transcribe({
        file: audioFile as File,
        model: "saaras:v3",
        mode: "transcribe"
      });
      
      const text = readTranscript(response);
      if (text) {
        return { text, provider: "sarvam", model: "saaras:v3" };
      }
    } catch (error) {
      console.error("Sarvam transcription failed, falling back to Whisper:", error);
    }
  }

  if (env.OPENAI_API_KEY) {
    const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    const response = await openai.audio.transcriptions.create({
      file: audioFile as File,
      model: "whisper-1"
    });
    return { text: response.text, provider: "openai", model: "whisper-1" };
  }

  throw new Error("No transcription provider configured.");
}

/**
 * Core evaluation logic using Gemini Flash.
 */
export async function evaluateAnswerService(
  question: string,
  transcript: string,
  competencyTags: string[]
): Promise<AnswerEvaluation> {
  if (!env.GEMINI_API_KEY) {
    return fallbackEvaluate(transcript);
  }

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

  return extractJsonObject<AnswerEvaluation>(response.text || "");
}

function readTranscript(response: unknown): string {
  if (typeof response === "object" && response !== null) {
    const record = response as Record<string, unknown>;
    const candidates = [record.transcript, record.text, record.transcription];
    const match = candidates.find((value) => typeof value === "string" && value.trim());
    return typeof match === "string" ? match : "";
  }
  return "";
}
