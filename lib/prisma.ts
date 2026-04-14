import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

import { Pool } from "pg";

const prismaClientSingleton = () => {
  const connectionString = process.env.DATABASE_URL;
  
  // During Vercel build, DATABASE_URL might be missing. 
  // We return a dummy client or handle it gracefully to allow the build to finish.
  if (!connectionString) {
    if (process.env.NEXT_PHASE === "phase-production-build" || process.env.NODE_ENV === "test") {
      return new PrismaClient();
    }
    throw new Error("DATABASE_URL is not set. Please check your environment variables.");
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool as any);
  return new PrismaClient({ adapter });
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;
