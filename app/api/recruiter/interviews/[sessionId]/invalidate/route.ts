import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  try {
    await prisma.interviewSession.update({
      where: { id: sessionId },
      data: { status: "EXPIRED" },
    });

    logger.info({ sessionId }, "Interview session manually invalidated by recruiter");
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error({ sessionId, error }, "Failed to invalidate session");
    return NextResponse.json({ error: "Failed to invalidate session" }, { status: 500 });
  }
}
