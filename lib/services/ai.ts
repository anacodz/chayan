import OpenAI from "openai";
import { SarvamAIClient } from "sarvamai";
import { GoogleGenAI } from "@google/genai";
import { env } from "@/lib/env";
import { withRetry } from "@/lib/retry";
import { fallbackEvaluate, fallbackSummarize } from "@/lib/evaluation";
import { extractJsonObject } from "@/lib/json";
import { AnswerEvaluationSchema, type AnswerEvaluation, type FinalReport } from "@/lib/schemas";
import { logger } from "@/lib/logger";

export type TranscriptionQuality = "OK" | "TOO_SHORT" | "EMPTY";

export interface TranscriptionResult {
  text: string;
  provider: string;
  model: string;
  quality: TranscriptionQuality;
}

/**
 * Core transcription logic with Sarvam primary and Whisper fallback.
 * Includes quality check (Milestone 2c).
 */
export async function transcribeAudioService(audioFile: File | Blob): Promise<TranscriptionResult> {
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
      if (!text.trim()) {
        return { text: "", provider: "sarvam", model: "saaras:v3", quality: "EMPTY" };
      }

      const wordCount = text.split(/\s+/).filter(Boolean).length;
      const quality = wordCount < 8 ? "TOO_SHORT" : "OK";

      return { text, provider: "sarvam", model: "saaras:v3", quality };
    } catch (error) {
      logger.error({ error }, "Sarvam transcription failed, falling back to Whisper");
    }
  }

  if (env.OPENAI_API_KEY) {
    const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    const response = await openai.audio.transcriptions.create({
      file: audioFile as File,
      model: "whisper-1"
    });
    
    const wordCount = response.text.split(/\s+/).filter(Boolean).length;
    const quality = wordCount < 8 ? "TOO_SHORT" : "OK";
    
    return { text: response.text, provider: "openai", model: "whisper-1", quality };
  }

  throw new Error("No transcription provider configured.");
}

export interface EvaluationResult extends AnswerEvaluation {
  model: string;
  promptVersion: string;
  schemaVersion: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

/**
 * Core evaluation logic using Gemini Flash with Zod validation and repair retry.
 */
export async function evaluateAnswerService(
  question: string,
  transcript: string,
  competencyTags: string[]
): Promise<EvaluationResult> {
  const modelName = "gemini-2.0-flash";
  const promptVersion = "v1.2";
  const schemaVersion = "v1";

  if (!env.GEMINI_API_KEY) {
    return {
      ...(fallbackEvaluate(transcript) as any),
      model: "fallback",
      promptVersion,
      schemaVersion,
    };
  }

  const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  const model = ai.getGenerativeModel({ model: modelName });
  
  const prompt = `Evaluate this tutor screening answer.

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
If the answer is too short, vague, or missing key competency signals, provide a short, targeted follow-up question in "followUpQuestion". Otherwise, set it to null.`;

  try {
    const result = await withRetry(async () => {
      return await model.generateContent(prompt);
    });

    const response = await result.response;
    const text = response.text() || "";
    const rawJson = extractJsonObject<any>(text);
    
    let evaluation: AnswerEvaluation;
    try {
      evaluation = AnswerEvaluationSchema.parse(rawJson);
    } catch (parseError) {
      logger.warn({ error: parseError, text }, "Evaluation JSON schema mismatch, attempting repair");
      
      const repairResult = await model.generateContent(`The following JSON did not match the required schema:
${JSON.stringify(rawJson)}

Error: ${parseError instanceof Error ? parseError.message : String(parseError)}

Please fix the JSON to strictly match this schema:
${JSON.stringify(AnswerEvaluationSchema.shape)}

Return fixed JSON only.`);
      
      const repairResponse = await repairResult.response;
      const repairedJson = extractJsonObject<any>(repairResponse.text() || "");
      evaluation = AnswerEvaluationSchema.parse(repairedJson);
    }

    return {
      ...evaluation,
      model: modelName,
      promptVersion,
      schemaVersion,
      usage: response.usageMetadata ? {
        inputTokens: response.usageMetadata.promptTokenCount,
        outputTokens: response.usageMetadata.candidatesTokenCount
      } : undefined
    };
  } catch (error) {
    logger.error({ error }, "Evaluation service failed after retries");
    return {
      ...(fallbackEvaluate(transcript) as any),
      model: modelName,
      promptVersion,
      schemaVersion,
    };
  }
}

/**
 * Text-to-Speech service using Sarvam AI Bulbul model.
 */
export async function textToSpeechService(text: string): Promise<{ audio: string }> {
  if (!env.SARVAM_API_KEY) {
    throw new Error("SARVAM_API_KEY is not configured.");
  }

  const client = new SarvamAIClient({
    apiSubscriptionKey: env.SARVAM_API_KEY
  });

  const response = await client.textToSpeech.convert({
    text,
    target_language_code: "en-IN",
    speaker: "shubh",
    model: "bulbul:v3"
  });

  if (response.audios && response.audios.length > 0) {
    return { audio: response.audios[0] };
  }

  throw new Error("Failed to generate audio from Sarvam TTS.");
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
