import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const body = await request.json();
  const { secondsToAdd } = body;

  if (typeof secondsToAdd !== "number") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    const updatedSession = await prisma.interviewSession.update({
      where: { id: sessionId },
      data: {
        activeSecondsSpent: {
          increment: secondsToAdd
        }
      },
      select: {
        activeSecondsSpent: true
      }
    });

    return NextResponse.json({ activeSecondsSpent: updatedSession.activeSecondsSpent });
  } catch (error) {
    console.error("Heartbeat failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
