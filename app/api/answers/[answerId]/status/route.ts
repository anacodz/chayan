import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { answerId: string } }
) {
  try {
    const answer = await prisma.answer.findUnique({
      where: { id: params.answerId },
      include: {
        transcript: true,
        evaluation: true,
      },
    });

    if (!answer) {
      return NextResponse.json({ error: "Answer not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      status: answer.status,
      transcript: answer.transcript?.text,
      evaluation: answer.evaluation 
        ? {
            score: (answer.evaluation.communicationClarity + answer.evaluation.conceptExplanation + answer.evaluation.empathyAndPatience) / 3, // Simple mock score
            reasoning: "AI evaluation completed.",
            signals: answer.evaluation.evidence,
            redFlags: answer.evaluation.concerns,
            dimensionScores: {
              communicationClarity: answer.evaluation.communicationClarity,
              conceptExplanation: answer.evaluation.conceptExplanation,
              empathyAndPatience: answer.evaluation.empathyAndPatience,
              adaptability: answer.evaluation.adaptability,
              professionalism: answer.evaluation.professionalism,
              englishFluency: answer.evaluation.englishFluency,
            },
            confidence: answer.evaluation.confidence,
            followUpQuestion: answer.evaluation.followUpQuestion,
          }
        : null
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
