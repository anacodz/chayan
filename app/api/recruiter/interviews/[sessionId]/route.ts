import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSignedAudioUrl } from "@/lib/storage";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

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

    // Sign audio URLs for recruiter playback
    const signedAnswers = await Promise.all(
      session.answers.map(async (answer) => ({
        ...answer,
        audioObjectKey: await getSignedAudioUrl(answer.audioObjectKey),
      }))
    );

    return NextResponse.json({ 
      session: {
        ...session,
        answers: signedAnswers
      } 
    });
  } catch (error) {
    console.error("Failed to fetch session:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
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
