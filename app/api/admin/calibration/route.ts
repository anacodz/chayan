import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { auth } from "@/lib/auth";

async function isAuthorized(req: Request, allowRecruiter = false) {
  const requiredAdminToken = process.env.ADMIN_API_TOKEN;
  const providedAdminToken = req.headers.get("x-admin-token");

  if (requiredAdminToken && providedAdminToken === requiredAdminToken) {
    return true;
  }

  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!role) return false;
  
  if (role === "ADMIN") return true;
  if (allowRecruiter && role === "RECRUITER") return true;
  
  return false;
}

export async function GET(req: Request) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const samples = await prisma.calibrationSample.findMany({
      include: {
        question: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ samples });
  } catch (error) {
    logger.error({ error }, "Failed to fetch calibration samples");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!(await isAuthorized(req, true))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { 
      questionId, 
      transcript, 
      communicationClarity, 
      conceptExplanation, 
      empathyAndPatience, 
      adaptability, 
      professionalism, 
      englishFluency,
      reasoning 
    } = body;

    const sample = await prisma.calibrationSample.create({
      data: {
        questionId,
        transcript,
        communicationClarity,
        conceptExplanation,
        empathyAndPatience,
        adaptability,
        professionalism,
        englishFluency,
        reasoning,
      },
    });

    return NextResponse.json({ sample });
  } catch (error) {
    logger.error({ error }, "Failed to create calibration sample");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
