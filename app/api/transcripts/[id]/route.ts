import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * Update a transcript (manual correction by recruiter).
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params; // Transcript ID
  const body = await request.json();
  const { text } = body;

  if (typeof text !== "string") {
    return NextResponse.json({ error: "Invalid text" }, { status: 400 });
  }

  try {
    const updatedTranscript = await prisma.transcript.update({
      where: { id },
      data: {
        text, // Update the main text (we can also store a copy in 'correctedText' if needed)
        correctedText: text // Also explicitly mark it as corrected
      }
    });

    return NextResponse.json({ transcript: updatedTranscript });
  } catch (error) {
    console.error("Failed to update transcript:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
