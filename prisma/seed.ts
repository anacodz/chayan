import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const connectionString = "postgresql://neondb_owner:npg_cpe2TotuVjh6@ep-spring-sunset-a1yqwe7l.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
const pool = new pg.Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding initial questions...')
  
  const questions = [
    {
      prompt: "Explain fractions to a 9-year-old who is seeing them for the first time.",
      category: "Pedagogy",
      competencyTags: ["concept_explanation", "clarity", "child_friendly_tone"],
      questionSetId: "default",
      order: 0,
      maxDurationSeconds: 90
    },
    {
      prompt: "A student has been staring at a problem for five minutes. What do you do next?",
      category: "Adaptability",
      competencyTags: ["empathy", "adaptability", "teaching_process"],
      questionSetId: "default",
      order: 1,
      maxDurationSeconds: 90
    },
    {
      prompt: "How do you respond when a student keeps saying, I do not get it?",
      category: "Philosophy",
      competencyTags: ["patience", "communication", "adaptability"],
      questionSetId: "default",
      order: 2,
      maxDurationSeconds: 90
    },
    {
      prompt: "Give a short update to a parent after a difficult but productive class.",
      category: "Experience",
      competencyTags: ["professionalism", "clarity", "empathy"],
      questionSetId: "default",
      order: 3,
      maxDurationSeconds: 90
    }
  ]

  for (const q of questions) {
    await prisma.question.create({
      data: {
        ...q,
        active: true
      }
    })
  }

  console.log('Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
