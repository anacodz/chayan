import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { v4 as uuidv4 } from "uuid";

export async function GET() {
  const requestId = uuidv4();
  try {
    logger.info({ requestId }, "Fetching all interview sessions");
    const sessions = await prisma.interviewSession.findMany({
      include: {
        candidate: true,
        finalReport: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    logger.info({ requestId, count: sessions.length }, "Interview sessions fetched successfully");
    return NextResponse.json({ sessions });
  } catch (error) {
    logger.error({ requestId, error: error instanceof Error ? error.message : "Unknown error" }, "Failed to fetch interviews");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
