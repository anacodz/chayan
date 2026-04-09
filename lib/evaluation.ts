import type { AnswerEvaluation, DimensionScores, FinalReport } from "@/lib/types";

const dimensions: Array<keyof DimensionScores> = [
  "communicationClarity",
  "conceptExplanation",
  "empathyAndPatience",
  "adaptability",
  "professionalism",
  "englishFluency"
];

export function fallbackEvaluate(transcript: string): AnswerEvaluation {
  const words = transcript.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const hasTeachingSignal = /example|because|first|then|try|understand|student|child|parent/i.test(transcript);
  const hasEmpathySignal = /help|encourage|patient|comfortable|confused|try again|good|progress/i.test(transcript);
  const base = wordCount >= 60 ? 4 : wordCount >= 30 ? 3 : wordCount >= 12 ? 2 : 1;

  const dimensionScores: DimensionScores = {
    communicationClarity: Math.min(5, base + (wordCount >= 40 ? 1 : 0)),
    conceptExplanation: Math.min(5, base + (hasTeachingSignal ? 1 : 0)),
    empathyAndPatience: Math.min(5, base + (hasEmpathySignal ? 1 : 0)),
    adaptability: Math.min(5, base + (/another way|different|break|step/i.test(transcript) ? 1 : 0)),
    professionalism: Math.min(5, base + (/parent|class|lesson|progress/i.test(transcript) ? 1 : 0)),
    englishFluency: Math.min(5, base + (wordCount >= 25 ? 1 : 0))
  };

  const score = averageScore(dimensionScores);

  return {
    score,
    reasoning:
      wordCount < 12
        ? "The answer is too short to establish strong tutor-readiness signals."
        : "The answer was scored with a local rubric because an AI provider key is not configured.",
    signals: [
      hasTeachingSignal ? "Mentions teaching process or examples." : "Limited explicit teaching structure.",
      hasEmpathySignal ? "Shows some empathy or encouragement." : "Limited empathy signal."
    ],
    redFlags: wordCount < 12 ? ["Answer is very short or incomplete."] : [],
    dimensionScores,
    confidence: wordCount >= 30 ? 0.62 : 0.38
  };
}

export function fallbackSummarize(
  answers: Array<{ transcript: string; evaluation: AnswerEvaluation }>
): FinalReport {
  const dimensionScores = dimensions.reduce((accumulator, dimension) => {
    accumulator[dimension] = round(
      answers.reduce((sum, answer) => sum + answer.evaluation.dimensionScores[dimension], 0) /
        Math.max(answers.length, 1)
    );
    return accumulator;
  }, {} as DimensionScores);

  const overall = averageScore(dimensionScores);
  const hasRedFlags = answers.some((answer) => answer.evaluation.redFlags.length > 0);
  const recommendation = overall >= 4 && !hasRedFlags ? "MOVE_FORWARD" : overall >= 3 ? "HOLD" : "DECLINE";

  return {
    recommendation,
    summary: "This report was generated from the submitted transcripts and tutor-readiness rubric.",
    dimensionScores,
    strengths: collectUnique(answers.flatMap((answer) => answer.evaluation.signals)).slice(0, 4),
    concerns: collectUnique(answers.flatMap((answer) => answer.evaluation.redFlags)).slice(0, 4),
    nextStep:
      recommendation === "MOVE_FORWARD"
        ? "Invite the candidate to the next teaching round."
        : recommendation === "HOLD"
          ? "Review the transcripts and ask one live follow-up before deciding."
          : "Do not move forward unless a recruiter sees contradictory evidence."
  };
}

export function averageScore(scores: DimensionScores): number {
  return round(dimensions.reduce((sum, dimension) => sum + scores[dimension], 0) / dimensions.length);
}

function collectUnique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}
