import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_NJ0YZQRX1dLj@ep-jolly-union-az6hqed2.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
