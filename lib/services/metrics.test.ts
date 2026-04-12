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
  },
}));

describe("metrics service", () => {
  it("calculates basic metrics correctly", async () => {
    // totalSessions, completedSessions, totalAnswers, fallbackAnswers
    (prisma.interviewSession.count as any)
      .mockResolvedValueOnce(10) // total
      .mockResolvedValueOnce(5); // completed
    (prisma.answer.count as any).mockResolvedValue(20);
    (prisma.transcript.count as any).mockResolvedValue(2);
    (prisma.answerEvaluation.aggregate as any).mockResolvedValue({
      _avg: { confidence: 0.8 },
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
    (prisma.answer.count as any).mockResolvedValue(0);
    (prisma.transcript.count as any).mockResolvedValue(0);
    (prisma.answerEvaluation.aggregate as any).mockResolvedValue({
      _avg: { confidence: null },
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
