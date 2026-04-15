import { z } from "zod";

export const recruiterDecisionSchema = z.object({
  decision: z.union([
    z.literal("MOVE_FORWARD"),
    z.literal("HOLD"),
    z.literal("DECLINE"),
    z.literal("NEEDS_REVIEW"),
    z.literal("Move Forward"),
    z.literal("Hold"),
    z.literal("Decline"),
    z.literal("Needs Review"),
  ]),
  notes: z.string().trim().max(2000).optional().nullable(),
  reviewerId: z.string().trim().min(1).max(128).optional().nullable(),
});

export type RecruiterDecisionInput = z.infer<typeof recruiterDecisionSchema>;
export type RecruiterDecisionType = "MOVE_FORWARD" | "HOLD" | "DECLINE" | "NEEDS_REVIEW";

export function normalizeRecruiterDecision(decision: RecruiterDecisionInput["decision"]): RecruiterDecisionType {
  const normalized = decision.replace(/\s+/g, "_").toUpperCase();

  switch (normalized) {
    case "MOVE_FORWARD":
      return "MOVE_FORWARD";
    case "HOLD":
      return "HOLD";
    case "DECLINE":
      return "DECLINE";
    case "NEEDS_REVIEW":
      return "NEEDS_REVIEW";
    default:
      throw new Error("Unsupported recruiter decision");
  }
}
