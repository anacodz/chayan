import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSignedAudioUrl } from "@/lib/storage";
import { normalizeRecruiterDecision, recruiterDecisionSchema } from "@/lib/recruiter-decision";

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
        recruiterDecision: true,
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

    // Filter out sensitive fields
    const { inviteTokenHash, ...safeSession } = session;

    return NextResponse.json({ 
      session: {
        ...safeSession,
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

  const parsed = recruiterDecisionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid decision payload" }, { status: 400 });
  }

  const { decision, notes, reviewerId } = parsed.data;
  const normalizedDecision = normalizeRecruiterDecision(decision);

  try {
    const recruiterDecision = await prisma.recruiterDecision.upsert({
      where: { sessionId },
      update: {
        decision: normalizedDecision,
        notes: notes ?? null,
        reviewerId: reviewerId || "system",
      },
      create: {
        sessionId,
        decision: normalizedDecision,
        notes: notes ?? null,
        reviewerId: reviewerId || "system",
      },
    });

    return NextResponse.json({ decision: recruiterDecision });
  } catch (error) {
    console.error("Failed to save decision:", error);
    return NextResponse.json({ error: "Failed to save decision" }, { status: 500 });
  }
}
