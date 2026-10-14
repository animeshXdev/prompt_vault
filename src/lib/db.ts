import path from "node:path";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function resolveDatabaseUrl(): string {
  const isVercel = !!process.env.VERCEL;
  const rawUrl = process.env.DATABASE_URL || (isVercel ? "file:/tmp/dev.db" : "file:./dev.db");
  if (rawUrl.startsWith("file:")) {
    const rawPath = rawUrl.replace(/^file:/, "");
    if (isVercel) {
      const filename = path.basename(rawPath) || "dev.db";
      return `file:/tmp/${filename}`;
    }
    if (!path.isAbsolute(rawPath)) {
      const absolutePath = path.resolve(/*turbopackIgnore: true*/ process.cwd(), rawPath).replace(/\\/g, "/");
      return `file:${absolutePath}`;
    }
  }
  return rawUrl;
}

export function createPrismaClient(): PrismaClient {
  const dbUrl = resolveDatabaseUrl();
  const authToken = process.env.TURSO_AUTH_TOKEN || process.env.DATABASE_AUTH_TOKEN;
  const adapter = new PrismaLibSql({
    url: dbUrl,
    ...(authToken ? { authToken } : {}),
  });
  const client = new PrismaClient({ adapter });
  return client;
}

export const prisma = global.__prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.__prisma = prisma;
}

export default prisma;
