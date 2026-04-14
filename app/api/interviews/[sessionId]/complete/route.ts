import { NextResponse } from "next/server";
import { inngest } from "@/lib/inngest";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  try {
    const session = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (session.status === "COMPLETED") {
      return NextResponse.json({ status: "ALREADY_COMPLETED" });
    }

    // Trigger background report generation
    await inngest.send({
      name: "interview/completed",
      data: { sessionId },
    });

    await prisma.interviewSession.update({
      where: { id: sessionId },
      data: { status: "FINALIZING" },
    });

    logger.info({ sessionId }, "Interview completion triggered");

    return NextResponse.json({ status: "FINALIZING" });
  } catch (error) {
    logger.error({ error, sessionId }, "Failed to complete interview");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
