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
  llmVoiceResponses: {
    total: number;
    evaluated: number;
    avgDurationSeconds: number;
    recent: Array<{
      answerId: string;
      sessionId: string;
      candidateName: string;
      questionPrompt: string;
      transcript: string;
      confidence: number;
      createdAt: Date;
    }>;
  };
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
    evaluatedAnswers,
    answerDuration,
    recentVoiceResponses,
    evalUsage,
    reportUsage
  ] = await Promise.all([
    prisma.interviewSession.count(),
    prisma.interviewSession.count({ where: { status: { notIn: ["INVITED", "EXPIRED"] } } }),
    prisma.interviewSession.count({ where: { status: "COMPLETED" } }),
    prisma.recruiterDecision.count(),
    prisma.answer.count(),
    prisma.transcript.count({ where: { provider: "openai" } }), // OpenAI is our fallback
    prisma.answerEvaluation.count(),
    prisma.answer.aggregate({
      _avg: {
        audioDurationSeconds: true,
      },
      where: {
        status: { in: ["TRANSCRIBED", "EVALUATED"] },
      },
    }),
    prisma.answerEvaluation.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        answer: {
          include: {
            question: {
              select: { prompt: true },
            },
            transcript: {
              select: { text: true, correctedText: true },
            },
            session: {
              include: {
                candidate: {
                  select: { name: true },
                },
              },
            },
          },
        },
      },
    }),
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
  const avgDurationSeconds = answerDuration._avg.audioDurationSeconds || 0;
  const llmVoiceResponses = recentVoiceResponses.map((item) => ({
    answerId: item.answerId,
    sessionId: item.answer.sessionId,
    candidateName: item.answer.session.candidate.name,
    questionPrompt: item.answer.question.prompt,
    transcript: (item.answer.transcript?.correctedText || item.answer.transcript?.text || "").slice(0, 400),
    confidence: item.confidence,
    createdAt: item.createdAt,
  }));

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
    llmVoiceResponses: {
      total: totalAnswers,
      evaluated: evaluatedAnswers,
      avgDurationSeconds,
      recent: llmVoiceResponses,
    },
    funnel: {
      invited: totalSessions,
      started: startedSessions,
      completed: completedSessions,
      reviewed: reviewedSessions,
    },
  };
}
