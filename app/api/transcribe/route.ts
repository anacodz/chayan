import { NextResponse } from "next/server";
import OpenAI from "openai";
import { SarvamAIClient } from "sarvamai";
import { uploadAudio } from "@/lib/storage";
import { v4 as uuidv4 } from "uuid";
import { env } from "@/lib/env";
import { withRetry } from "@/lib/retry";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const formData = await request.formData();
  const audio = formData.get("audio");

  if (!(audio instanceof File) || audio.size === 0) {
    return NextResponse.json({ error: "Upload a non-empty audio file." }, { status: 400 });
  }

  try {
    // 1. Upload audio to object storage
    const filename = `${uuidv4()}.${audio.name.split(".").pop() || "webm"}`;
    const audioUrl = await uploadAudio(audio, filename);

    // 2. Transcribe audio
    const transcript = await withRetry(() => transcribeAudio(audio));

    if (!transcript.trim()) {
      return NextResponse.json({ error: "The transcript was empty. Try recording again." }, { status: 422 });
    }

    return NextResponse.json({ transcript, audioUrl });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Transcription failed." },
      { status: 500 }
    );
  }
}

async function transcribeAudio(audio: File): Promise<string> {
  if (env.SARVAM_API_KEY) {
    try {
      const client = new SarvamAIClient({
        apiSubscriptionKey: env.SARVAM_API_KEY
      });
      const response = await client.speechToText.transcribe({
        file: audio,
        model: "saaras:v3",
        mode: "transcribe"
      });
      const text = readTranscript(response);

      if (text) {
        return text;
      }
    } catch {
      // Fall through to Whisper when Sarvam is unavailable or returns an unexpected payload.
    }
  }

  if (env.OPENAI_API_KEY) {
    const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    const response = await openai.audio.transcriptions.create({
      file: audio,
      model: "whisper-1"
    });
    return response.text;
  }

  throw new Error("Configure SARVAM_API_KEY or OPENAI_API_KEY to enable transcription.");
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
