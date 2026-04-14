import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  try {
    await prisma.interviewSession.update({
      where: { id: sessionId },
      data: {
        consentAcceptedAt: new Date(),
        status: "CONSENTED",
      },
    });

    return NextResponse.json({ status: "OK" });
  } catch (error) {
    console.error("Consent recording failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
