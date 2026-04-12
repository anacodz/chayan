import { serve } from "inngest/next";
import { inngest, transcribeAndEvaluateAnswer, cleanupOldData } from "@/lib/inngest";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    transcribeAndEvaluateAnswer,
    cleanupOldData,
  ],
});
