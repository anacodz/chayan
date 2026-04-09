export const questions = [
  {
    id: "fractions",
    prompt: "Explain fractions to a 9-year-old who is seeing them for the first time.",
    guidance: "Use a simple example, keep the explanation warm, and speak as if you are teaching a child.",
    competencyTags: ["concept_explanation", "clarity", "child_friendly_tone"]
  },
  {
    id: "stuck-student",
    prompt: "A student has been staring at a problem for five minutes. What do you do next?",
    guidance: "Show how you would diagnose confusion without making the student feel judged.",
    competencyTags: ["empathy", "adaptability", "teaching_process"]
  },
  {
    id: "i-dont-get-it",
    prompt: "How do you respond when a student keeps saying, I do not get it?",
    guidance: "Focus on patience, encouragement, and changing your explanation strategy.",
    competencyTags: ["patience", "communication", "adaptability"]
  },
  {
    id: "parent-update",
    prompt: "Give a short update to a parent after a difficult but productive class.",
    guidance: "Balance honesty, professionalism, and confidence in the learning plan.",
    competencyTags: ["professionalism", "clarity", "empathy"]
  }
] as const;

export type Question = (typeof questions)[number];
