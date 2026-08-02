import { defineConfig } from "@prisma/config";

const databaseUrl =
  process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_NJ0YZQRX1dLj@ep-jolly-union-az6hqed2.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

export default defineConfig({
  schema: "./prisma/schema.prisma",
  datasource: {
    url: databaseUrl,
  },
});
