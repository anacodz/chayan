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
    },
    transcript: {
      count: vi.fn(),
    },
    answerEvaluation: {
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
  });

  it("handles zero values without error", async () => {
    (prisma.interviewSession.count as any).mockResolvedValue(0);
    (prisma.recruiterDecision.count as any).mockResolvedValue(0);
    (prisma.answer.count as any).mockResolvedValue(0);
    (prisma.transcript.count as any).mockResolvedValue(0);
    
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
  });
});
