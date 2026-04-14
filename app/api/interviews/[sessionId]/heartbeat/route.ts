import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  let body;
  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { secondsToAdd } = body;

  // 1. Validate that 'secondsToAdd' is a positive integer between 1 and 15.
  if (
    typeof secondsToAdd !== "number" ||
    !Number.isInteger(secondsToAdd) ||
    secondsToAdd < 1 ||
    secondsToAdd > 15
  ) {
    return NextResponse.json(
      { error: "Invalid secondsToAdd. Must be an integer between 1 and 15." },
      { status: 400 }
    );
  }

  try {
    // 2. Implement rate-limiting by checking the session's 'updatedAt' field.
    const session = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
      select: { updatedAt: true },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const now = new Date();
    const lastUpdate = new Date(session.updatedAt);
    const msSinceLastUpdate = now.getTime() - lastUpdate.getTime();

    // 3. Return a 429 status if rate-limited (at least 8 seconds).
    if (msSinceLastUpdate < 8000) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait at least 8 seconds between heartbeats." },
        { status: 429 }
      );
    }

    const updatedSession = await prisma.interviewSession.update({
      where: { id: sessionId },
      data: {
        activeSecondsSpent: {
          increment: secondsToAdd,
        },
      },
      select: {
        activeSecondsSpent: true,
      },
    });

    return NextResponse.json({
      activeSecondsSpent: updatedSession.activeSecondsSpent,
    });
  } catch (error) {
    logger.error({ error, sessionId }, "Heartbeat failed");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
