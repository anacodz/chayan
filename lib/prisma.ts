import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

import { Pool } from "pg";

const prismaClientSingleton = () => {
  if (process.env.NEXT_PHASE === "phase-production-build" || process.env.NODE_ENV === "test") {
    // Return a proxy that prevents actual connection attempts during build
    return new Proxy({} as PrismaClient, {
      get: (target, prop) => {
        if (prop === "$on" || prop === "$connect" || prop === "$disconnect" || prop === "$use") {
          return () => {};
        }
        return () => {
          throw new Error(`Prisma operation "${String(prop)}" attempted during build phase. Ensure DATABASE_URL is provided if this is required.`);
        };
      }
    });
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Please check your environment variables.");
  }

  const pool = new Pool({ 
    connectionString,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
  
  const adapter = new PrismaPg(pool as any);
  return new PrismaClient({ adapter });
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;
