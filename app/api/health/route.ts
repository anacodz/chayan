import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Check DB connection
    await prisma.$queryRaw`SELECT 1`;
    
    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      services: {
        database: "connected",
        api: "healthy",
      }
    });
  } catch (error) {
    logger.error({ error }, "Health check failed");
    return NextResponse.json({
      status: "error",
      timestamp: new Date().toISOString(),
      services: {
        database: "disconnected",
        api: "degraded",
      }
    }, { status: 503 });
  }
}
