/**
 * Domain model types — aligned with PDD Section 7.
 * These are the client-side types used in the MVP candidate flow.
 * Server-side persistence types will be added in Phase 2.
 */

export type DimensionScores = {
  communicationClarity: number;
  conceptExplanation: number;
  empathyAndPatience: number;
  adaptability: number;
  professionalism: number;
  englishFluency: number;
};

/** Per-answer evaluation produced by Gemini Flash model (PDD §11) */
export type AnswerEvaluation = {
  /** Aggregate score 1–5 */
  score: number;
  /** Reasoning grounded in the transcript */
  reasoning: string;
  /** Positive evidence signals extracted from the transcript */
  signals: string[];
  /** Concerns or red flags identified */
  redFlags: string[];
  /** Per-dimension scores — all 1–5 */
  dimensionScores: DimensionScores;
  /** 0–1 confidence in the evaluation */
  confidence: number;
  /** Optional targeted follow-up question when answer is incomplete */
  followUpQuestion?: string | null;
  /** Set to true when the transcript is too short or unclear to evaluate reliably */
  requiresHumanReview?: boolean;
  /** Set to true when a human has reviewed the AI evaluation */
  isHumanReviewed?: boolean;
  /** Human-provided dimension scores */
  humanDimensionScores?: DimensionScores;
  /** Human-provided reasoning */
  humanReasoning?: string;
};

export type Question = {
  id: string;
  prompt: string;
  guidance?: string;
  competencyTags: string[];
  maxDurationSeconds: number;
};

export type Answer = {
  questionId: string;
  question: string;
  transcript: string;
  evaluation: AnswerEvaluation;
};

/** Final assessment report produced by Gemini Pro model (PDD §11) */
export type FinalReport = {
  /** Recruiter-facing hiring recommendation */
  recommendation: "MOVE_FORWARD" | "HOLD" | "DECLINE";
  /** One-paragraph summary for the recruiter */
  summary: string;
  /** Aggregated dimension scores across all answers */
  dimensionScores: DimensionScores;
  /** Top candidate strengths with transcript evidence */
  strengths: string[];
  /** Risks or concerns for recruiter attention */
  concerns: string[];
  /** Suggested recruiter next step */
  nextStep: string;
  /** 0–1 confidence in the overall recommendation */
  confidence?: number;
  /** Set when low-confidence answers affect the recommendation */
  requiresHumanReview?: boolean;
};
