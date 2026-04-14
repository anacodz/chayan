import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { v4 as uuidv4 } from "uuid";

export async function GET() {
  const requestId = uuidv4();
  try {
    logger.info({ requestId }, "Fetching recruiter team members");

    const users = await prisma.user.findMany({
      where: {
        role: "RECRUITER",
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    const decisionsGroup = await prisma.recruiterDecision.groupBy({
      by: ['reviewerId'],
      _count: {
        id: true,
      },
    });

    const decisionsMap = decisionsGroup.reduce((acc: Record<string, number>, curr) => {
      acc[curr.reviewerId] = curr._count.id;
      return acc;
    }, {});

    const team = users.map(user => ({
      id: user.id,
      name: user.name || "Unknown Recruiter",
      email: user.email || "",
      image: user.image || "",
      lastLogin: user.updatedAt,
      decisionsCount: decisionsMap[user.id] || 0,
    }));

    return NextResponse.json({ team });
  } catch (error) {
    logger.error({ requestId, error: error instanceof Error ? error.message : "Unknown error" }, "Failed to fetch team members");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
