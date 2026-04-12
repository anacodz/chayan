import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { v4 as uuidv4 } from "uuid";

export const GET = auth(async (req) => {
  const requestId = uuidv4();
  
  if (!req.auth || (req.auth.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const questionSetId = searchParams.get("questionSetId");

  try {
    const questions = await prisma.question.findMany({
      where: questionSetId ? { questionSetId } : undefined,
      orderBy: { order: "asc" }
    });
    return NextResponse.json({ questions });
  } catch (error) {
    logger.error({ requestId, error }, "Failed to fetch questions");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});

export const POST = auth(async (req) => {
  const requestId = uuidv4();

  if (!req.auth || (req.auth.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { prompt, competencyTags, questionSetId = "default", maxDurationSeconds = 90, order } = body;

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // Determine the next order if not provided
    let nextOrder = order;
    if (nextOrder === undefined) {
      const lastQ = await prisma.question.findFirst({
        where: { questionSetId },
        orderBy: { order: "desc" }
      });
      nextOrder = lastQ ? lastQ.order + 1 : 0;
    }

    const question = await prisma.question.create({
      data: {
        prompt,
        competencyTags: Array.isArray(competencyTags) ? competencyTags : [],
        questionSetId,
        maxDurationSeconds,
        order: nextOrder,
        active: true
      }
    });

    logger.info({ requestId, questionId: question.id }, "Question created");
    return NextResponse.json({ question });
  } catch (error) {
    logger.error({ requestId, error }, "Failed to create question");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
