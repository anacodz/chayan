import { Inngest } from "inngest";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "chayan" });

// Define background functions here or in a separate file
export const transcribeAndEvaluateAnswer = inngest.createFunction(
  { id: "transcribe-and-evaluate-answer" },
  { event: "answer/uploaded" },
  async ({ event, step }) => {
    const { sessionId, questionId, audioUrl, question, competencyTags } = event.data;

    const transcript = await step.run("transcribe-audio", async () => {
      // Logic from transcribe API
      const res = await fetch(`${process.env.APP_BASE_URL}/api/transcribe/internal`, {
        method: "POST",
        body: JSON.stringify({ audioUrl }),
      });
      return await res.json();
    });

    const evaluation = await step.run("evaluate-answer", async () => {
      // Logic from evaluate API
      const res = await fetch(`${process.env.APP_BASE_URL}/api/evaluate/internal`, {
        method: "POST",
        body: JSON.stringify({
          question,
          competencyTags,
          transcript: transcript.text,
          sessionId,
          questionId,
          audioUrl
        }),
      });
      return await res.json();
    });

    return { transcript, evaluation };
  }
);
