import { NextResponse } from "next/server";
import { textToSpeechService } from "@/lib/services/ai";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text } = body;

    if (!text || typeof text !== "string") {
      logger.warn("TTS request with missing or invalid text");
      return NextResponse.json({ error: "A non-empty text string is required." }, { status: 400 });
    }

    logger.info({ textLength: text.length }, "Processing TTS request");

    const result = await textToSpeechService(text);

    logger.info("TTS generation successful");

    return NextResponse.json({ 
      audio: result.audio,
      format: "mp3", // Sarvam Bulbul:v3 returns mp3 by default for REST
    });
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : "Unknown error" }, "TTS route failed");
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "TTS generation failed." },
      { status: 500 }
    );
  }
}
