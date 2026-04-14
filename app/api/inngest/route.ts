import { serve } from "inngest/next";
import { inngest, transcribeAndEvaluateAnswer, finalizeInterviewReport, cleanupOldData } from "@/lib/inngest";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    transcribeAndEvaluateAnswer,
    finalizeInterviewReport,
    cleanupOldData,
  ],
});
