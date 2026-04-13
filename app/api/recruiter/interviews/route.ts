import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { v4 as uuidv4 } from "uuid";

export async function GET(req: Request) {
  const requestId = uuidv4();
  const { searchParams } = new URL(req.url);
  const skip = parseInt(searchParams.get("skip") || "0");
  const take = parseInt(searchParams.get("take") || "10");

  try {
    logger.info({ requestId, skip, take }, "Fetching interview sessions");
    const [sessions, total] = await Promise.all([
      prisma.interviewSession.findMany({
        skip,
        take,
        include: {
          candidate: true,
          finalReport: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.interviewSession.count()
    ]);

    logger.info({ requestId, count: sessions.length, total }, "Interview sessions fetched successfully");
    return NextResponse.json({ sessions, total });
  } catch (error) {
    logger.error({ requestId, error: error instanceof Error ? error.message : "Unknown error" }, "Failed to fetch interviews");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
