import { serve } from "inngest/next";
import { inngest, transcribeAndEvaluateAnswer } from "@/lib/inngest";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    transcribeAndEvaluateAnswer,
  ],
});
