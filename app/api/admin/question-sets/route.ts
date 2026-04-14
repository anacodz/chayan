import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const questionSets = await prisma.question.groupBy({
      by: ["questionSetId"],
      _count: {
        id: true,
      },
      where: {
        active: true,
      },
    });

    return NextResponse.json({
      sets: questionSets.map((set) => ({
        id: set.questionSetId,
        count: set._count.id,
      })),
    });
  } catch (error) {
    logger.error({ error }, "Failed to fetch question sets");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
