import { NextResponse } from "next/server";
import { getSystemMetrics } from "@/lib/services/metrics";
import { logger } from "@/lib/logger";
import { v4 as uuidv4 } from "uuid";

export async function GET(req: Request) {
  const requestId = uuidv4();

  const requiredAdminToken = process.env.ADMIN_API_TOKEN;
  const providedAdminToken = req.headers.get("x-admin-token");

  if (requiredAdminToken && providedAdminToken !== requiredAdminToken) {
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
