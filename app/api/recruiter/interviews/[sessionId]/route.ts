import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { sessionId: string } }
) {
  const { sessionId } = params;

  try {
    const session = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
      include: {
        candidate: true,
        answers: {
          include: {
            transcript: true,
            evaluation: true,
          },
        },
        finalReport: true,
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error("Failed to fetch session:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { sessionId: string } }
) {
  const { sessionId } = params;
  const body = await request.json();
  const { decision, notes, reviewerId } = body;

  try {
    const recruiterDecision = await prisma.recruiterDecision.upsert({
      where: { sessionId },
      update: {
        decision: decision.replace(" ", "_").toUpperCase(),
        notes,
        reviewerId: reviewerId || "system",
      },
      create: {
        sessionId,
        decision: decision.replace(" ", "_").toUpperCase(),
        notes,
        reviewerId: reviewerId || "system",
      },
    });

    return NextResponse.json({ decision: recruiterDecision });
  } catch (error) {
    console.error("Failed to save decision:", error);
    return NextResponse.json({ error: "Failed to save decision" }, { status: 500 });
  }
}
