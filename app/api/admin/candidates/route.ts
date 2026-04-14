import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";

  const requiredAdminToken = process.env.ADMIN_API_TOKEN;
  const providedAdminToken = req.headers.get("x-admin-token");

  if (requiredAdminToken && providedAdminToken !== requiredAdminToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const candidates = await prisma.candidate.findMany({
      where: search ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } }
        ]
      } : undefined,
      include: {
        interviewSessions: {
          select: {
            id: true,
            status: true,
            createdAt: true,
          }
        }
      },
      take: 20,
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ candidates });
  } catch (error) {
    logger.error({ error }, "Failed to search candidates");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
