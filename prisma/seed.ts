import { PrismaClient } from "@prisma/client";
import { questions } from "../lib/questions";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding default questions...");

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    await prisma.question.upsert({
      where: { id: q.id },
      update: {
        prompt: q.prompt,
        competencyTags: q.competencyTags as string[],
        order: i,
        questionSetId: "default",
        active: true,
      },
      create: {
        id: q.id,
        prompt: q.prompt,
        competencyTags: q.competencyTags as string[],
        order: i,
        questionSetId: "default",
        active: true,
      },
    });
  }

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
