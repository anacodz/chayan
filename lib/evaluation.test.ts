import { describe, it, expect } from "vitest";
import { fallbackEvaluate, averageScore } from "./evaluation";

describe("evaluation logic", () => {
  it("calculates average score correctly", () => {
    const scores = {
      communicationClarity: 4,
      conceptExplanation: 3,
      empathyAndPatience: 5,
      adaptability: 4,
      professionalism: 4,
      englishFluency: 4,
    };
    expect(averageScore(scores)).toBe(4);
  });

  it("provides lower scores for very short transcripts", () => {
    const evaluation = fallbackEvaluate("Yes, I agree.");
    expect(evaluation.score).toBeLessThan(3);
    expect(evaluation.redFlags).toContain("Answer is very short or incomplete.");
  });

  it("detects teaching signals in transcript", () => {
    const evaluation = fallbackEvaluate("For example, I first explain the concept and then try to help the student understand.");
    expect(evaluation.signals).toContain("Mentions teaching process or examples.");
  });
});
