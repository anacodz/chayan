import prisma from "../prisma";

export interface DashboardMetrics {
  totalInvites: number;
  completionRate: number;
  avgTimeToReportMs: number;
  sttFallbackRate: number;
  avgConfidence: number;
  totalCostUSD: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  funnel: {
    invited: number;
    started: number;
    completed: number;
    reviewed: number;
  };
}

/**
 * Service to calculate system KPIs as defined in PDD §16.
 */
export async function getSystemMetrics(): Promise<DashboardMetrics> {
  const [
    totalSessions, 
    startedSessions, 
    completedSessions, 
    reviewedSessions, 
    totalAnswers, 
    fallbackAnswers,
    evalUsage,
    reportUsage
  ] = await Promise.all([
    prisma.interviewSession.count(),
    prisma.interviewSession.count({ where: { status: { notIn: ["INVITED", "EXPIRED"] } } }),
    prisma.interviewSession.count({ where: { status: "COMPLETED" } }),
    prisma.recruiterDecision.count(),
    prisma.answer.count(),
    prisma.transcript.count({ where: { provider: "openai" } }), // OpenAI is our fallback
    prisma.answerEvaluation.aggregate({
      _sum: {
        costUSD: true,
        inputTokens: true,
        outputTokens: true,
      }
    }),
    prisma.finalReport.aggregate({
      _sum: {
        costUSD: true,
        inputTokens: true,
        outputTokens: true,
      }
    })
  ]);

  const totalCostUSD = (evalUsage._sum.costUSD || 0) + (reportUsage._sum.costUSD || 0);
  const totalInputTokens = (evalUsage._sum.inputTokens || 0) + (reportUsage._sum.inputTokens || 0);
  const totalOutputTokens = (evalUsage._sum.outputTokens || 0) + (reportUsage._sum.outputTokens || 0);

  // Calculate completion rate
  const completionRate = totalSessions > 0 ? (completedSessions / totalSessions) : 0;

  // Calculate STT fallback rate
  const sttFallbackRate = totalAnswers > 0 ? (fallbackAnswers / totalAnswers) : 0;

  // Calculate avg confidence from evaluations
  const evaluations = await prisma.answerEvaluation.aggregate({
    _avg: {
      confidence: true,
    },
  });

  // Calculate avg time to report (simplified: completedAt - createdAt)
  const completedStats = await prisma.interviewSession.findMany({
    where: { 
      status: "COMPLETED",
      completedAt: { not: null }
    },
    select: {
      createdAt: true,
      completedAt: true,
    },
  });

  let avgTimeToReportMs = 0;
  if (completedStats.length > 0) {
    const totalMs = completedStats.reduce((acc, s) => {
      return acc + (s.completedAt!.getTime() - s.createdAt.getTime());
    }, 0);
    avgTimeToReportMs = totalMs / completedStats.length;
  }

  return {
    totalInvites: totalSessions,
    completionRate,
    avgTimeToReportMs,
    sttFallbackRate,
    avgConfidence: evaluations._avg.confidence || 0,
    totalCostUSD,
    totalInputTokens,
    totalOutputTokens,
    funnel: {
      invited: totalSessions,
      started: startedSessions,
      completed: completedSessions,
      reviewed: reviewedSessions,
    },
  };
}
