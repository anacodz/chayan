import { describe, it, expect, vi } from "vitest";
import { fallbackEvaluate, fallbackSummarize } from "@/lib/evaluation";

describe("E2E Service Logic Flow", () => {
  it("should handle the full evaluation and summarization logic correctly", () => {
    // 1. Initial State: Questions
    const questions = [
      { id: "q1", prompt: "Explain fractions to a child." },
      { id: "q2", prompt: "How do you handle a student who is struggling?" }
    ];

    // 2. Transcripts from Candidate
    const transcript1 = "To explain fractions, I would use a pizza. I would cut it into four slices. Each slice is one-fourth. It helps the child visualize the part of a whole.";
    const transcript2 = "I would be patient with the student. I would try different examples and encourage them at every step. It is important to make them feel comfortable.";

    // 3. Evaluation Step (using fallback logic to verify the rubric logic)
    const eval1 = fallbackEvaluate(transcript1);
    const eval2 = fallbackEvaluate(transcript2);

    expect(eval1.dimensionScores.conceptExplanation).toBeGreaterThanOrEqual(3);
    expect(eval2.dimensionScores.empathyAndPatience).toBeGreaterThanOrEqual(3);

    // 4. Summarization Step
    const answers = [
      { questionId: "q1", question: questions[0].prompt, transcript: transcript1, evaluation: eval1 },
      { questionId: "q2", question: questions[1].prompt, transcript: transcript2, evaluation: eval2 }
    ];

    const finalReport = fallbackSummarize(answers);

    // 5. Final Result Verification
    expect(finalReport.recommendation).toBeDefined();
    expect(["MOVE_FORWARD", "HOLD", "DECLINE"]).toContain(finalReport.recommendation);
    expect(finalReport.strengths.length).toBeGreaterThan(0);
    expect(finalReport.dimensionScores.communicationClarity).toBeGreaterThan(0);
    
    // Check if the overall recommendation makes sense for these high-quality answers
    if (finalReport.dimensionScores.communicationClarity >= 4) {
      expect(finalReport.recommendation).toBe("MOVE_FORWARD");
    }
  });
});
