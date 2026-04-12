import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const questionSetId = searchParams.get("questionSetId") || "default";
  const subject = searchParams.get("subject");
  const experienceLevel = searchParams.get("experienceLevel");
  const randomize = searchParams.get("randomize") === "true";
  const limit = parseInt(searchParams.get("limit") || "6");

  try {
    const questions = await prisma.question.findMany({
      where: { 
        questionSetId,
        active: true,
        ...(subject ? { subject } : {}),
        ...(experienceLevel ? { experienceLevel } : {}),
      },
      orderBy: { order: "asc" }
    });
    
    let result = questions;
    if (randomize) {
      result = questions.sort(() => Math.random() - 0.5).slice(0, limit);
    }
    
    return NextResponse.json({ questions: result });
  } catch (error) {
    logger.error({ error, questionSetId }, "Failed to fetch public questions");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
