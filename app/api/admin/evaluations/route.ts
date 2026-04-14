import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { auth } from "@/lib/auth";

async function isAuthorized(req: Request) {
  const requiredAdminToken = process.env.ADMIN_API_TOKEN;
  const providedAdminToken = req.headers.get("x-admin-token");

  if (requiredAdminToken && providedAdminToken === requiredAdminToken) {
    return true;
  }

  const session = await auth();
  return !!(session?.user && (session.user as { role?: string }).role === "ADMIN");
}

export async function GET(req: Request) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const includeReviewed = searchParams.get("includeReviewed") === "true";

  try {
    const evaluations = await prisma.answerEvaluation.findMany({
      where: {
        OR: [
          { requiresHumanReview: true },
          { confidence: { lt: 0.7 } },
        ],
        ...(includeReviewed ? {} : { isHumanReviewed: false }),
      },
      include: {
        answer: {
          include: {
            question: true,
            transcript: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ evaluations });
  } catch (error) {
    logger.error({ error }, "Failed to fetch evaluations for calibration");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
