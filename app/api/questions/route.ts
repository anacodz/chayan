import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";

const CATEGORIES = [
  "Pedagogy",
  "Adaptability",
  "Engagement",
  "Scenarios",
  "Philosophy",
  "Experience"
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const questionSetId = searchParams.get("questionSetId") || "default";

  try {
    // 1. Fetch all active questions for this set
    const allQuestions = await prisma.question.findMany({
      where: { 
        questionSetId,
        active: true,
      },
    });

    // 2. Group by category and pick 1 random from each
    const selectedQuestions: typeof allQuestions = [];
    
    for (const cat of CATEGORIES) {
      const catQuestions = allQuestions.filter(q => q.category === cat);
      if (catQuestions.length > 0) {
        const randomQ = catQuestions[Math.floor(Math.random() * catQuestions.length)];
        selectedQuestions.push(randomQ);
      }
    }

    // 3. If no categories were assigned (legacy data), fallback to original order
    if (selectedQuestions.length === 0 && allQuestions.length > 0) {
      return NextResponse.json({ 
        questions: allQuestions.sort((a, b) => a.order - b.order).slice(0, 6) 
      });
    }

    // Return in random order to user
    return NextResponse.json({ 
      questions: selectedQuestions.sort(() => Math.random() - 0.5) 
    });
  } catch (error) {
    logger.error({ error, questionSetId }, "Failed to fetch categorized questions");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
