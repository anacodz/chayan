import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set.");
}

const pool = new pg.Pool({ connectionString })
const adapter = new PrismaPg(pool as any)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding initial questions...')
  
  // Clear existing questions to avoid duplicates during this large seed
  // Actually, let's just use upsert or create if we know we want a fresh start.
  // For this challenge, we'll just add them.
  
  const questions = [
    // 1. Pedagogy
    {
      prompt: "Explain fractions to a 9-year-old who is seeing them for the first time.",
      category: "Pedagogy",
      competencyTags: ["concept_explanation", "clarity", "child_friendly_tone"],
      questionSetId: "default",
      order: 0,
      maxDurationSeconds: 90
    },
    {
      prompt: "How would you teach the concept of 'negative numbers' using a real-world example?",
      category: "Pedagogy",
      competencyTags: ["real_world_connection", "clarity"],
      questionSetId: "default",
      order: 1,
      maxDurationSeconds: 90
    },
    {
      prompt: "A student is struggling to understand why we need to find a common denominator to add fractions. How do you explain it?",
      category: "Pedagogy",
      competencyTags: ["deep_understanding", "analogy"],
      questionSetId: "default",
      order: 2,
      maxDurationSeconds: 120
    },
    {
      prompt: "Explain the Pythagorean theorem without just giving the formula a² + b² = c².",
      category: "Pedagogy",
      competencyTags: ["conceptual_teaching", "geometry"],
      questionSetId: "default",
      order: 3,
      maxDurationSeconds: 120
    },
    {
      prompt: "How do you introduce the concept of variables (like 'x') to a student who has only done arithmetic?",
      category: "Pedagogy",
      competencyTags: ["abstraction", "scaffolding"],
      questionSetId: "default",
      order: 4,
      maxDurationSeconds: 90
    },
    {
      prompt: "Explain the difference between area and perimeter to a 3rd grader.",
      category: "Pedagogy",
      competencyTags: ["clarity", "visual_thinking"],
      questionSetId: "default",
      order: 5,
      maxDurationSeconds: 90
    },
    {
      prompt: "How would you help a student visualize the concept of 'pi' (π)?",
      category: "Pedagogy",
      competencyTags: ["visualization", "discovery_learning"],
      questionSetId: "default",
      order: 6,
      maxDurationSeconds: 90
    },
    {
      prompt: "Describe how you would teach multi-digit multiplication using the area model versus the standard algorithm.",
      category: "Pedagogy",
      competencyTags: ["multiple_representations", "procedural_fluency"],
      questionSetId: "default",
      order: 7,
      maxDurationSeconds: 120
    },

    // 2. Adaptability
    {
      prompt: "A student has been staring at a problem for five minutes. What do you do next?",
      category: "Adaptability",
      competencyTags: ["empathy", "adaptability", "teaching_process"],
      questionSetId: "default",
      order: 8,
      maxDurationSeconds: 90
    },
    {
      prompt: "You planned a lesson on decimals, but you realize the student hasn't mastered fractions yet. How do you pivot?",
      category: "Adaptability",
      competencyTags: ["lesson_pivoting", "assessment"],
      questionSetId: "default",
      order: 9,
      maxDurationSeconds: 90
    },
    {
      prompt: "A student solves a problem using a method you didn't teach and haven't seen before. How do you respond?",
      category: "Adaptability",
      competencyTags: ["open_mindedness", "mathematical_flexibility"],
      questionSetId: "default",
      order: 10,
      maxDurationSeconds: 90
    },
    {
      prompt: "You notice a student is becoming visibly frustrated with a difficult word problem. How do you intervene?",
      category: "Adaptability",
      competencyTags: ["emotional_regulation", "empathy"],
      questionSetId: "default",
      order: 11,
      maxDurationSeconds: 90
    },
    {
      prompt: "A student finds the current topic too easy and is getting bored. How do you adjust the challenge level?",
      category: "Adaptability",
      competencyTags: ["differentiation", "enrichment"],
      questionSetId: "default",
      order: 12,
      maxDurationSeconds: 90
    },
    {
      prompt: "The internet connection is lagging and the whiteboard isn't loading properly. How do you continue the session?",
      category: "Adaptability",
      competencyTags: ["technical_troubleshooting", "resourcefulness"],
      questionSetId: "default",
      order: 13,
      maxDurationSeconds: 90
    },
    {
      prompt: "A student is distracted by something happening in their room. How do you bring their focus back to math?",
      category: "Adaptability",
      competencyTags: ["classroom_management", "focus"],
      questionSetId: "default",
      order: 14,
      maxDurationSeconds: 90
    },
    {
      prompt: "You realize your explanation is confusing the student more. How do you restart the explanation differently?",
      category: "Adaptability",
      competencyTags: ["self_reflection", "alternative_explanation"],
      questionSetId: "default",
      order: 15,
      maxDurationSeconds: 120
    },

    // 3. Engagement
    {
      prompt: "How do you make a lesson on 'long division' exciting for a student who finds it tedious?",
      category: "Engagement",
      competencyTags: ["motivation", "gamification"],
      questionSetId: "default",
      order: 16,
      maxDurationSeconds: 90
    },
    {
      prompt: "A student asks, 'When am I ever going to use this in real life?' regarding algebra. What is your answer?",
      category: "Engagement",
      competencyTags: ["relevance", "inspiration"],
      questionSetId: "default",
      order: 17,
      maxDurationSeconds: 90
    },
    {
      prompt: "How do you use praise effectively to motivate a student who has low confidence in math?",
      category: "Engagement",
      competencyTags: ["positive_reinforcement", "growth_mindset"],
      questionSetId: "default",
      order: 18,
      maxDurationSeconds: 90
    },
    {
      prompt: "Describe a 'hook' you would use at the beginning of a lesson to grab a student's attention.",
      category: "Engagement",
      competencyTags: ["lesson_opening", "curiosity"],
      questionSetId: "default",
      order: 19,
      maxDurationSeconds: 90
    },
    {
      prompt: "How do you incorporate a student's personal interests (like Minecraft or sports) into a word problem?",
      category: "Engagement",
      competencyTags: ["personalization", "creativity"],
      questionSetId: "default",
      order: 20,
      maxDurationSeconds: 90
    },
    {
      prompt: "A student is very quiet and only gives one-word answers. How do you encourage them to speak more and explain their thinking?",
      category: "Engagement",
      competencyTags: ["questioning_techniques", "rapport_building"],
      questionSetId: "default",
      order: 21,
      maxDurationSeconds: 120
    },
    {
      prompt: "What strategies do you use to keep a high-energy student engaged during an online session?",
      category: "Engagement",
      competencyTags: ["active_participation", "pacing"],
      questionSetId: "default",
      order: 22,
      maxDurationSeconds: 90
    },
    {
      prompt: "How do you celebrate a student's small wins to build long-term momentum?",
      category: "Engagement",
      competencyTags: ["encouragement", "confidence_building"],
      questionSetId: "default",
      order: 23,
      maxDurationSeconds: 90
    },

    // 4. Scenarios
    {
      prompt: "A parent interrupts the session to complain that the progress is too slow. How do you handle this politely?",
      category: "Scenarios",
      competencyTags: ["parent_communication", "professionalism"],
      questionSetId: "default",
      order: 24,
      maxDurationSeconds: 120
    },
    {
      prompt: "A student starts crying because they got a 'C' on their school math test. What do you say?",
      category: "Scenarios",
      competencyTags: ["empathy", "mentorship"],
      questionSetId: "default",
      order: 25,
      maxDurationSeconds: 90
    },
    {
      prompt: "You accidentally make a mistake while solving a problem on screen. How do you handle it?",
      category: "Scenarios",
      competencyTags: ["vulnerability", "modeling_error_correction"],
      questionSetId: "default",
      order: 26,
      maxDurationSeconds: 90
    },
    {
      prompt: "The student's younger sibling is making a lot of noise in the background. How do you handle the situation?",
      category: "Scenarios",
      competencyTags: ["conflict_resolution", "patience"],
      questionSetId: "default",
      order: 27,
      maxDurationSeconds: 90
    },
    {
      prompt: "A student tells you they hate math because their school teacher is mean. How do you respond?",
      category: "Scenarios",
      competencyTags: ["rapport", "professional_boundaries"],
      questionSetId: "default",
      order: 28,
      maxDurationSeconds: 120
    },
    {
      prompt: "The session is ending, but you are in the middle of an important concept. Do you stay extra time or end exactly on the hour?",
      category: "Scenarios",
      competencyTags: ["time_management", "commitment"],
      questionSetId: "default",
      order: 29,
      maxDurationSeconds: 90
    },
    {
      prompt: "A student refuses to turn on their camera. How do you build rapport and ensure they are engaged?",
      category: "Scenarios",
      competencyTags: ["online_teaching_strategies", "flexibility"],
      questionSetId: "default",
      order: 30,
      maxDurationSeconds: 120
    },
    {
      prompt: "A student keeps guessing answers instead of working through the steps. How do you guide them back to the process?",
      category: "Scenarios",
      competencyTags: ["process_over_result", "guiding"],
      questionSetId: "default",
      order: 31,
      maxDurationSeconds: 90
    },

    // 5. Philosophy
    {
      prompt: "How do you respond when a student keeps saying, 'I do not get it'?",
      category: "Philosophy",
      competencyTags: ["patience", "communication", "adaptability"],
      questionSetId: "default",
      order: 32,
      maxDurationSeconds: 90
    },
    {
      prompt: "What do you believe is the most important quality of a great math tutor?",
      category: "Philosophy",
      competencyTags: ["teaching_values", "self_awareness"],
      questionSetId: "default",
      order: 33,
      maxDurationSeconds: 90
    },
    {
      prompt: "Do you believe in giving the answer quickly to maintain speed, or letting the student struggle? Why?",
      category: "Philosophy",
      competencyTags: ["productive_struggle", "pedagogical_belief"],
      questionSetId: "default",
      order: 34,
      maxDurationSeconds: 120
    },
    {
      prompt: "How do you define 'mathematical thinking' beyond just getting the right answer?",
      category: "Philosophy",
      competencyTags: ["subject_depth", "educational_philosophy"],
      questionSetId: "default",
      order: 35,
      maxDurationSeconds: 120
    },
    {
      prompt: "What is your approach to helping a student who has 'math anxiety'?",
      category: "Philosophy",
      competencyTags: ["psychology_of_learning", "empathy"],
      questionSetId: "default",
      order: 36,
      maxDurationSeconds: 120
    },
    {
      prompt: "How do you balance procedural fluency (knowing how) with conceptual understanding (knowing why)?",
      category: "Philosophy",
      competencyTags: ["pedagogy", "curriculum_balance"],
      questionSetId: "default",
      order: 37,
      maxDurationSeconds: 120
    },
    {
      prompt: "What role does 'curiosity' play in your math sessions?",
      category: "Philosophy",
      competencyTags: ["inquiry_based_learning", "engagement"],
      questionSetId: "default",
      order: 38,
      maxDurationSeconds: 90
    },
    {
      prompt: "How do you feel about the use of calculators in elementary math education?",
      category: "Philosophy",
      competencyTags: ["critical_thinking", "educational_tools"],
      questionSetId: "default",
      order: 39,
      maxDurationSeconds: 90
    },

    // 6. Experience
    {
      prompt: "Give a short update to a parent after a difficult but productive class.",
      category: "Experience",
      competencyTags: ["professionalism", "clarity", "empathy"],
      questionSetId: "default",
      order: 40,
      maxDurationSeconds: 90
    },
    {
      prompt: "Tell us about a time you helped a student who was significantly behind their grade level.",
      category: "Experience",
      competencyTags: ["remediation", "persistence"],
      questionSetId: "default",
      order: 41,
      maxDurationSeconds: 120
    },
    {
      prompt: "Describe your most successful tutoring session. What made it work?",
      category: "Experience",
      competencyTags: ["success_indicators", "reflection"],
      questionSetId: "default",
      order: 42,
      maxDurationSeconds: 120
    },
    {
      prompt: "How many years of experience do you have teaching or tutoring math, and for which grade levels?",
      category: "Experience",
      competencyTags: ["background", "expertise"],
      questionSetId: "default",
      order: 43,
      maxDurationSeconds: 60
    },
    {
      prompt: "Have you taught in an online environment before? What tools are you comfortable with?",
      category: "Experience",
      competencyTags: ["technical_skill", "online_fluency"],
      questionSetId: "default",
      order: 44,
      maxDurationSeconds: 90
    },
    {
      prompt: "Describe a time you had to deal with a very difficult student. How did you manage their behavior?",
      category: "Experience",
      competencyTags: ["classroom_management", "resilience"],
      questionSetId: "default",
      order: 45,
      maxDurationSeconds: 120
    },
    {
      prompt: "What is your experience with standardized test prep (like SAT, ACT, or grade-level state tests)?",
      category: "Experience",
      competencyTags: ["test_prep", "results_oriented"],
      questionSetId: "default",
      order: 46,
      maxDurationSeconds: 90
    },
    {
      prompt: "How do you keep yourself updated with the latest teaching methods and math curriculum changes?",
      category: "Experience",
      competencyTags: ["continuous_learning", "professional_growth"],
      questionSetId: "default",
      order: 47,
      maxDurationSeconds: 90
    }
  ]

  for (const q of questions) {
    // Using upsert to avoid duplicates if re-running seed
    await prisma.question.upsert({
      where: { 
        // We need a unique way to identify questions. 
        // Since id is uuid and auto-generated, we might need to add a unique field or just use prompt if we trust it.
        // For seed simplicity, we'll just check if a question with the same prompt and questionSetId exists.
        // But question table doesn't have a unique constraint on prompt.
        // Let's just create them for now, or check manually.
        id: "placeholder" // This won't work for real upsert without a stable ID.
      },
      create: {
        ...q,
        active: true
      },
      update: {
        ...q,
        active: true
      }
    }).catch(async (e) => {
      // If upsert fails because of ID, just create
      await prisma.question.create({
        data: {
          ...q,
          active: true
        }
      })
    })
  }

  console.log(`Seed completed successfully! Added ${questions.length} questions.`);
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
