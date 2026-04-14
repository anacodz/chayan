import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const evaluations = await prisma.answerEvaluation.findMany({
      take: 50,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        answer: {
          include: {
            question: true,
            transcript: true,
          }
        }
      }
    });

    const formattedEvaluations = evaluations.map(evalRecord => ({
      id: evalRecord.id,
      promptVersion: evalRecord.promptVersion,
      model: evalRecord.modelProvider + "/" + evalRecord.model,
      score: evalRecord.communicationClarity, // Representing general score with communicationClarity for now
      humanCorrected: !!evalRecord.answer.transcript?.correctedText,
      originalTranscript: evalRecord.answer.transcript?.text,
      correctedTranscript: evalRecord.answer.transcript?.correctedText,
      question: evalRecord.answer.question.prompt,
      createdAt: evalRecord.createdAt,
    }));

    return NextResponse.json({ evaluations: formattedEvaluations });
  } catch (error) {
    logger.error({ error }, "Failed to fetch calibration data");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
