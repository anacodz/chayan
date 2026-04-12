import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { uploadAudio } from "@/lib/storage";
import { transcribeAudioService } from "@/lib/services/ai";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const requestId = uuidv4();
  try {
    const formData = await request.formData();
    const audio = formData.get("audio");

    if (!(audio instanceof File) || audio.size === 0) {
      logger.warn({ requestId }, "Transcribe attempt with empty file");
      return NextResponse.json({ error: "Upload a non-empty audio file." }, { status: 400 });
    }

    logger.info({ requestId, fileName: audio.name, size: audio.size }, "Processing transcription request");

    // 1. Upload audio to object storage
    const filename = `${uuidv4()}.${audio.name.split(".").pop() || "webm"}`;
    const audioUrl = await uploadAudio(audio, filename);
    
    logger.info({ requestId, audioUrl }, "Audio uploaded to storage");

    // 2. Transcribe audio
    const result = await transcribeAudioService(audio);

    if (!result.text.trim()) {
      logger.error({ requestId, audioUrl }, "Transcript was empty");
      return NextResponse.json({ error: "The transcript was empty. Try recording again." }, { status: 422 });
    }

    logger.info({ requestId, provider: result.provider, model: result.model }, "Transcription successful");

    return NextResponse.json({ 
      transcript: result.text, 
      audioUrl,
      provider: result.provider,
      model: result.model
    });
  } catch (error) {
    logger.error({ requestId, error: error instanceof Error ? error.message : "Unknown error" }, "Transcription route failed");
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Transcription failed." },
      { status: 500 }
    );
  }
}
