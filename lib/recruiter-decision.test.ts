import { describe, expect, it } from "vitest";
import { normalizeRecruiterDecision, recruiterDecisionSchema } from "./recruiter-decision";

describe("recruiter decision utilities", () => {
  it("normalizes button labels to enum values", () => {
    expect(normalizeRecruiterDecision("Move Forward")).toBe("MOVE_FORWARD");
    expect(normalizeRecruiterDecision("Hold")).toBe("HOLD");
    expect(normalizeRecruiterDecision("Decline")).toBe("DECLINE");
    expect(normalizeRecruiterDecision("Needs Review")).toBe("NEEDS_REVIEW");
  });

  it("accepts enum values directly", () => {
    expect(normalizeRecruiterDecision("MOVE_FORWARD")).toBe("MOVE_FORWARD");
    expect(normalizeRecruiterDecision("HOLD")).toBe("HOLD");
  });

  it("validates request payload for hold/review/decline flow", () => {
    const valid = recruiterDecisionSchema.safeParse({
      decision: "Decline",
      notes: "Lacks rubric-aligned examples",
      reviewerId: "recruiter-1",
    });

    expect(valid.success).toBe(true);

    const invalid = recruiterDecisionSchema.safeParse({
      decision: "Maybe",
      notes: "N/A",
      reviewerId: "recruiter-1",
    });

    expect(invalid.success).toBe(false);
  });
});
