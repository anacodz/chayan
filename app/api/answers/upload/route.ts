import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { uploadAudio } from "@/lib/storage";
import { inngest } from "@/lib/inngest";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const requestId = uuidv4();
  try {
    const formData = await request.formData();
    const audio = formData.get("audio");
    const sessionId = formData.get("sessionId") as string;
    const questionId = formData.get("questionId") as string;
    const question = formData.get("question") as string;
    const competencyTags = JSON.parse(formData.get("competencyTags") as string || "[]");

    if (!(audio instanceof File) || audio.size === 0) {
      logger.warn({ requestId, sessionId }, "Upload attempt with empty file");
      return NextResponse.json({ error: "Upload a non-empty audio file." }, { status: 400 });
    }

    if (!sessionId || !questionId) {
      logger.warn({ requestId }, "Upload attempt with missing identifiers");
      return NextResponse.json({ error: "sessionId and questionId are required." }, { status: 400 });
    }

    logger.info({ requestId, sessionId, questionId }, "Processing answer upload");

    // 1. Upload audio to object storage
    const filename = `${uuidv4()}.${audio.name.split(".").pop() || "webm"}`;
    const audioUrl = await uploadAudio(audio, filename);
    
    logger.info({ requestId, sessionId, audioUrl }, "Audio uploaded successfully");

    // 2. Create answer record in DB
    const answer = await prisma.answer.create({
      data: {
        sessionId,
        questionId,
        audioObjectKey: audioUrl,
        status: "UPLOADED",
      }
    });

    logger.info({ requestId, sessionId, answerId: answer.id }, "Answer record created");

    // 3. Trigger Inngest job for async processing
    await inngest.send({
      name: "answer/uploaded",
      data: {
        answerId: answer.id,
        sessionId,
        questionId,
        audioUrl,
        question,
        competencyTags,
      },
    });

    logger.info({ requestId, sessionId, answerId: answer.id }, "Background job triggered");

    return NextResponse.json({ 
      answerId: answer.id, 
      status: "UPLOADED",
      audioUrl 
    });
  } catch (error) {
    logger.error({ requestId, error: error instanceof Error ? error.message : "Unknown error" }, "Answer upload route failed");
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed." },
      { status: 500 }
    );
  }
}
