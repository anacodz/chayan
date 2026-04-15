import { describe, it, expect, vi } from "vitest";
import { getSystemMetrics } from "./metrics";
import prisma from "../prisma";

vi.mock("../prisma", () => ({
  default: {
    interviewSession: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    answer: {
      count: vi.fn(),
      aggregate: vi.fn(),
    },
    transcript: {
      count: vi.fn(),
    },
    answerEvaluation: {
      count: vi.fn(),
      findMany: vi.fn(),
      aggregate: vi.fn(),
    },
    finalReport: {
      aggregate: vi.fn(),
    },
    recruiterDecision: {
      count: vi.fn(),
    },
  },
}));

describe("metrics service", () => {
  it("calculates basic metrics correctly", async () => {
    // totalSessions, startedSessions, completedSessions, reviewedSessions, totalAnswers, fallbackAnswers
    (prisma.interviewSession.count as any)
      .mockResolvedValueOnce(10) // total
      .mockResolvedValueOnce(8)  // started
      .mockResolvedValueOnce(5); // completed
    (prisma.recruiterDecision.count as any).mockResolvedValue(3);
    (prisma.answer.count as any).mockResolvedValue(20);
    (prisma.transcript.count as any).mockResolvedValue(2);
    (prisma.answerEvaluation.count as any).mockResolvedValue(15);
    (prisma.answer.aggregate as any).mockResolvedValue({ _avg: { audioDurationSeconds: 42 } });
    (prisma.answerEvaluation.findMany as any).mockResolvedValue([
      {
        answerId: "a1",
        confidence: 0.9,
        createdAt: new Date("2026-01-01T10:00:00.000Z"),
        answer: {
          sessionId: "s1",
          question: { prompt: "Explain fractions" },
          transcript: { text: "Sample transcript", correctedText: null },
          session: { candidate: { name: "Ana" } },
        },
      },
    ]);
    
    // evalUsage (first call to aggregate)
    (prisma.answerEvaluation.aggregate as any)
      .mockResolvedValueOnce({
        _sum: { costUSD: 0.5, inputTokens: 1000, outputTokens: 500 }
      })
      // evaluations (second call to aggregate)
      .mockResolvedValueOnce({
        _avg: { confidence: 0.8 }
      });

    // reportUsage
    (prisma.finalReport.aggregate as any).mockResolvedValue({
      _sum: { costUSD: 0.2, inputTokens: 400, outputTokens: 200 }
    });

    (prisma.interviewSession.findMany as any).mockResolvedValue([
      { createdAt: new Date(2023, 1, 1, 10, 0), completedAt: new Date(2023, 1, 1, 10, 30) }, // 30 min
      { createdAt: new Date(2023, 1, 1, 11, 0), completedAt: new Date(2023, 1, 1, 11, 30) }, // 30 min
    ]);

    const result = await getSystemMetrics();

    expect(result.totalInvites).toBe(10);
    expect(result.completionRate).toBe(0.5);
    expect(result.sttFallbackRate).toBe(0.1);
    expect(result.avgConfidence).toBe(0.8);
    expect(result.avgTimeToReportMs).toBe(1800000); // 30 min in ms
    expect(result.llmVoiceResponses.total).toBe(20);
    expect(result.llmVoiceResponses.evaluated).toBe(15);
    expect(result.llmVoiceResponses.avgDurationSeconds).toBe(42);
    expect(result.llmVoiceResponses.recent).toHaveLength(1);
    expect(result.llmVoiceResponses.recent[0].candidateName).toBe("Ana");
  });

  it("handles zero values without error", async () => {
    (prisma.interviewSession.count as any).mockResolvedValue(0);
    (prisma.recruiterDecision.count as any).mockResolvedValue(0);
    (prisma.answer.count as any).mockResolvedValue(0);
  (prisma.answer.aggregate as any).mockResolvedValue({ _avg: { audioDurationSeconds: null } });
    (prisma.transcript.count as any).mockResolvedValue(0);
  (prisma.answerEvaluation.count as any).mockResolvedValue(0);
  (prisma.answerEvaluation.findMany as any).mockResolvedValue([]);
    
    (prisma.answerEvaluation.aggregate as any)
      .mockResolvedValueOnce({ _sum: { costUSD: null, inputTokens: null, outputTokens: null } })
      .mockResolvedValueOnce({ _avg: { confidence: null } });
    
    (prisma.finalReport.aggregate as any).mockResolvedValue({
      _sum: { costUSD: null, inputTokens: null, outputTokens: null }
    });

    (prisma.interviewSession.findMany as any).mockResolvedValue([]);

    const result = await getSystemMetrics();

    expect(result.totalInvites).toBe(0);
    expect(result.completionRate).toBe(0);
    expect(result.sttFallbackRate).toBe(0);
    expect(result.avgConfidence).toBe(0);
    expect(result.avgTimeToReportMs).toBe(0);
    expect(result.llmVoiceResponses.total).toBe(0);
    expect(result.llmVoiceResponses.evaluated).toBe(0);
    expect(result.llmVoiceResponses.avgDurationSeconds).toBe(0);
    expect(result.llmVoiceResponses.recent).toHaveLength(0);
  });
});
