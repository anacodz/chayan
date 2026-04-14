import { NextResponse } from "next/server";
import { getSystemMetrics } from "@/lib/services/metrics";
import { logger } from "@/lib/logger";
import { v4 as uuidv4 } from "uuid";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const requestId = uuidv4();

  const requiredAdminToken = process.env.ADMIN_API_TOKEN;
  const providedAdminToken = req.headers.get("x-admin-token");

  // Check for either a valid static token OR an active session
  const session = await auth();

  const isTokenValid = requiredAdminToken && providedAdminToken === requiredAdminToken;
  const isSessionValid = !!(session?.user && (session.user as { role?: string }).role === "ADMIN");

  if (!isTokenValid && !isSessionValid) {
    logger.warn({ requestId }, "Unauthorized metrics access attempt");
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const metrics = await getSystemMetrics();
    return NextResponse.json(metrics);
  } catch (error) {
    logger.error({ requestId, error }, "Failed to fetch system metrics");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
