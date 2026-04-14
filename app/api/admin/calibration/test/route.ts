import { NextResponse } from "next/server";
import { evaluateAnswerService } from "@/lib/services/ai";
import { logger } from "@/lib/logger";

export async function POST(req: Request) {
  const requiredAdminToken = process.env.ADMIN_API_TOKEN;
  const providedAdminToken = req.headers.get("x-admin-token");

  if (requiredAdminToken && providedAdminToken !== requiredAdminToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { question, transcript, competencyTags, groundTruth } = body;

    if (!question || !transcript) {
      return NextResponse.json({ error: "Question and transcript required" }, { status: 400 });
    }

    const evaluation = await evaluateAnswerService(question, transcript, competencyTags);

    const comparison = {
      communicationClarity: { ai: evaluation.dimensionScores.communicationClarity, truth: groundTruth.communicationClarity },
      conceptExplanation: { ai: evaluation.dimensionScores.conceptExplanation, truth: groundTruth.conceptExplanation },
      empathyAndPatience: { ai: evaluation.dimensionScores.empathyAndPatience, truth: groundTruth.empathyAndPatience },
      adaptability: { ai: evaluation.dimensionScores.adaptability, truth: groundTruth.adaptability },
      professionalism: { ai: evaluation.dimensionScores.professionalism, truth: groundTruth.professionalism },
      englishFluency: { ai: evaluation.dimensionScores.englishFluency, truth: groundTruth.englishFluency },
    };

    return NextResponse.json({ evaluation, comparison });
  } catch (error) {
    logger.error({ error }, "Calibration test failed");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
