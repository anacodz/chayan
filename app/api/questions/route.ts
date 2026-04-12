import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const questionSetId = searchParams.get("questionSetId") || "default";

  try {
    const questions = await prisma.question.findMany({
      where: { 
        questionSetId,
        active: true,
      },
      orderBy: { order: "asc" }
    });
    
    return NextResponse.json({ questions });
  } catch (error) {
    logger.error({ error, questionSetId }, "Failed to fetch public questions");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
