import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { v4 as uuidv4 } from "uuid";

export const PUT = auth(async (req, { params }) => {
  const requestId = uuidv4();
  
  if (!req.auth || (req.auth.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Next.js route handlers with NextAuth pass params as the second argument,
  // but due to the auth wrapper, we might need to cast or access it carefully.
  // @ts-ignore
  const id = params?.id;

  if (!id) {
    return NextResponse.json({ error: "Question ID is required" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { prompt, competencyTags, maxDurationSeconds, active, order } = body;

    const question = await prisma.question.update({
      where: { id },
      data: {
        ...(prompt !== undefined && { prompt }),
        ...(competencyTags !== undefined && { competencyTags }),
        ...(maxDurationSeconds !== undefined && { maxDurationSeconds }),
        ...(active !== undefined && { active }),
        ...(order !== undefined && { order }),
      }
    });

    logger.info({ requestId, questionId: id }, "Question updated");
    return NextResponse.json({ question });
  } catch (error) {
    logger.error({ requestId, error }, "Failed to update question");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});

export const DELETE = auth(async (req, { params }) => {
  const requestId = uuidv4();
  
  if (!req.auth || (req.auth.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // @ts-ignore
  const id = params?.id;

  if (!id) {
    return NextResponse.json({ error: "Question ID is required" }, { status: 400 });
  }

  try {
    // We do a soft delete (mark as inactive) or a hard delete based on requirements.
    // PDD mentions CRUD. Let's just do a hard delete if no answers exist, or mark inactive.
    // For simplicity, we'll mark it inactive.
    const question = await prisma.question.update({
      where: { id },
      data: { active: false }
    });

    logger.info({ requestId, questionId: id }, "Question deleted (marked inactive)");
    return NextResponse.json({ question });
  } catch (error) {
    logger.error({ requestId, error }, "Failed to delete question");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
