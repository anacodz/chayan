import { z } from "zod";

export const DimensionScoresSchema = z.object({
  communicationClarity: z.number().min(1).max(5),
  conceptExplanation: z.number().min(1).max(5),
  empathyAndPatience: z.number().min(1).max(5),
  adaptability: z.number().min(1).max(5),
  professionalism: z.number().min(1).max(5),
  englishFluency: z.number().min(1).max(5),
});

export const AnswerEvaluationSchema = z.object({
  score: z.number().min(1).max(5),
  reasoning: z.string(),
  signals: z.array(z.string()),
  redFlags: z.array(z.string()),
  dimensionScores: DimensionScoresSchema,
  confidence: z.number().min(0).max(1),
  followUpQuestion: z.string().nullable().optional(),
  requiresHumanReview: z.boolean().optional(),
  isHumanReviewed: z.boolean().optional(),
  humanDimensionScores: DimensionScoresSchema.optional(),
  humanReasoning: z.string().optional(),
});

export const FinalReportSchema = z.object({
  recommendation: z.enum(["MOVE_FORWARD", "HOLD", "DECLINE"]),
  summary: z.string(),
  dimensionScores: DimensionScoresSchema,
  strengths: z.array(z.string()),
  concerns: z.array(z.string()),
  nextStep: z.string(),
  confidence: z.number().min(0).max(1).optional(),
});

export type DimensionScores = z.infer<typeof DimensionScoresSchema>;
export type AnswerEvaluation = z.infer<typeof AnswerEvaluationSchema>;
export type FinalReport = z.infer<typeof FinalReportSchema>;
