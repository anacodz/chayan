import { z } from "zod";

const envSchema = z.object({
  // AI Keys
  SARVAM_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),

  // Database
  DATABASE_URL: z.string().url(),

  // Storage
  BLOB_READ_WRITE_TOKEN: z.string().optional(),

  // Auth
  NEXTAUTH_SECRET: z.string().optional(),
  NEXTAUTH_URL: z.string().url().optional(),

  // App
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export const env = envSchema.parse(process.env);

export function validateEnv() {
  try {
    envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingKeys = error.issues.map((err) => err.path.join(".")).join(", ");
      throw new Error(`Missing or invalid environment variables: ${missingKeys}`);
    }
    throw error;
  }
}
