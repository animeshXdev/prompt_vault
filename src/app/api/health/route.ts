import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    // Check SQLite DB connectivity
    const adminCount = await prisma.administrator.count();
    return NextResponse.json({
      status: "ok",
      app: "PromptVault",
      timestamp: new Date().toISOString(),
      database: "connected",
      adminInitialized: adminCount > 0,
      uptime: process.uptime(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "error",
        database: "disconnected",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
