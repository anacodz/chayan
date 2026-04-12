import { Inngest } from "inngest";
import { transcribeAudioService, evaluateAnswerService } from "./services/ai";
import prisma from "./prisma";
import { logger } from "./logger";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "chayan" });

/**
 * Background job to transcribe and evaluate an answer.
 * Triggers on 'answer/uploaded' event.
 */
export const transcribeAndEvaluateAnswer = inngest.createFunction(
  { id: "transcribe-and-evaluate-answer" },
  { event: "answer/uploaded" },
  async ({ event, step }) => {
    const { answerId, sessionId, questionId, audioUrl, question, competencyTags } = event.data;
    
    logger.info({ answerId, sessionId }, "Starting background processing for answer");

    // 1. Transcribe audio
    const transcriptionResult = await step.run("transcribe-audio", async () => {
      logger.info({ answerId }, "Transcribing audio");
      const audioRes = await fetch(audioUrl);
      const audioBlob = await audioRes.blob();
      
      return await transcribeAudioService(audioBlob);
    });

    // 2. Save transcript to database
    await step.run("save-transcript", async () => {
      logger.info({ answerId }, "Saving transcript");
...
    });

    // 3. Evaluate transcript
    const evaluation = await step.run("evaluate-answer", async () => {
      logger.info({ answerId }, "Evaluating transcript");
      return await evaluateAnswerService(question, transcriptionResult.text, competencyTags);
    });

    // 4. Save evaluation and update answer status
    await step.run("save-evaluation", async () => {
      logger.info({ answerId }, "Saving evaluation");
...

    return { answerId, status: "completed" };
  }
);
