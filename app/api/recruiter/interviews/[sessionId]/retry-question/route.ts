import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId } = await params;
  const body = await request.json();
  const { questionId } = body;

  if (!questionId) {
    return NextResponse.json({ error: "Missing questionId" }, { status: 400 });
  }

  try {
    // 1. Mark the specific answer as needing retry
    // We find the latest answer for this question in this session
    const lastAnswer = await prisma.answer.findFirst({
      where: {
        sessionId,
        questionId
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    if (lastAnswer) {
      await prisma.answer.update({
        where: { id: lastAnswer.id },
        data: { status: "NEEDS_RETRY" }
      });
    }

    // 2. Set session status to NEEDS_CANDIDATE_RETRY
    // This will allow the candidate's hook to detect it and restore correctly
    await prisma.interviewSession.update({
      where: { id: sessionId },
      data: { 
        status: "NEEDS_CANDIDATE_RETRY",
        completedAt: null // Re-open the session if it was completed
      }
    });

    return NextResponse.json({ status: "OK" });
  } catch (error) {
    console.error("Failed to trigger retry:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
