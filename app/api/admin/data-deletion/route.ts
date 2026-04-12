import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { deleteAudio } from "@/lib/storage";
import { logger } from "@/lib/logger";
import { v4 as uuidv4 } from "uuid";
import { auth } from "@/lib/auth";

/**
 * POST /api/admin/data-deletion
 * Deletes all data associated with a candidate (PII, audio, transcripts).
 * Restricted to ADMIN role.
 */
export const POST = auth(async (req) => {
  const requestId = uuidv4();
  
  // Check authorization
  if (!req.auth || (req.auth.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { candidateId } = await req.json();

    if (!candidateId) {
      return NextResponse.json({ error: "candidateId is required" }, { status: 400 });
    }

    logger.info({ requestId, candidateId }, "Starting manual data deletion for candidate");

    // 1. Get all sessions and answers to find audio URLs
    const sessions = await prisma.interviewSession.findMany({
      where: { candidateId },
      include: {
        answers: true,
      },
    });

    const audioUrls = sessions.flatMap(s => s.answers.map(a => a.audioObjectKey));

    // 2. Delete audio from object storage
    logger.info({ requestId, candidateId, audioCount: audioUrls.length }, "Deleting audio blobs");
    for (const url of audioUrls) {
      if (url.startsWith("http")) {
        try {
          await deleteAudio(url);
        } catch (e) {
          logger.error({ requestId, url, error: e }, "Failed to delete audio blob");
        }
      }
    }

    // 3. Delete candidate and all relations (Cascade delete handled by DB/Prisma if configured, 
    // but we'll do it manually or via single transaction for safety)
    // Note: In our schema, we should ensure relations are cleaned up.
    
    await prisma.$transaction([
      prisma.answerEvaluation.deleteMany({ where: { answer: { session: { candidateId } } } }),
      prisma.transcript.deleteMany({ where: { answer: { session: { candidateId } } } }),
      prisma.answer.deleteMany({ where: { session: { candidateId } } }),
      prisma.finalReport.deleteMany({ where: { session: { candidateId } } }),
      prisma.recruiterDecision.deleteMany({ where: { session: { candidateId } } }),
      prisma.interviewSession.deleteMany({ where: { candidateId } }),
      prisma.candidate.delete({ where: { id: candidateId } }),
    ]);

    logger.info({ requestId, candidateId }, "Data deletion completed successfully");

    return NextResponse.json({ success: true, message: "Candidate data deleted" });
  } catch (error) {
    logger.error({ requestId, error: error instanceof Error ? error.message : "Unknown error" }, "Data deletion failed");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
