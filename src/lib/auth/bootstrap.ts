import prisma from "@/lib/db";
import { hashPassword } from "@/lib/security/crypto";

export interface BootstrapResult {
  initialized: boolean;
  adminEmail: string;
  adminCreated: boolean;
  message: string;
}

/**
 * Initializes the database on startup.
 * CRITICAL RULE: The environment password is ONLY an initial bootstrap credential.
 * Once the administrator changes the password inside the application,
 * the database password remains authoritative and is NEVER overwritten.
 */
export async function bootstrapSystem(): Promise<BootstrapResult> {
  const adminCount = await prisma.administrator.count();

  let adminCreated = false;
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase() || "admin@example.com";

  if (adminCount === 0) {
    const rawDefaultPassword = process.env.ADMIN_DEFAULT_PASSWORD || "AdminVault2026!Secure";
    const passwordHash = await hashPassword(rawDefaultPassword);

    await prisma.administrator.create({
      data: {
        email: adminEmail,
        passwordHash,
      },
    });

    adminCreated = true;
    console.log(`[PromptVault] Initial administrator created for ${adminEmail}`);
  } else {
    // If the administrator email in .env was changed, sync it to the database
    const existingAdmin = await prisma.administrator.findFirst();
    if (existingAdmin && existingAdmin.email !== adminEmail) {
      await prisma.administrator.update({
        where: { id: existingAdmin.id },
        data: { email: adminEmail },
      });
      console.log(`[PromptVault] Administrator email synchronized from .env: ${existingAdmin.email} -> ${adminEmail}`);
    }
  }

  // Ensure default application settings exist
  const existingSettings = await prisma.applicationSettings.findUnique({
    where: { id: "default" },
  });

  if (!existingSettings) {
    await prisma.applicationSettings.create({
      data: {
        id: "default",
        appName: process.env.APP_NAME || "PromptVault",
        defaultAiPlatform: "openai",
        editorFontSize: 14,
        autosaveInterval: 1000,
        defaultEditorMode: "split",
        sessionExpirationDays: 30,
        storagePath: "./data/uploads",
        themePreference: "system",
      },
    });
  }

  // Seed default categories if none exist
  const categoryCount = await prisma.category.count();
  if (categoryCount === 0) {
    await prisma.category.createMany({
      data: [
        { name: "Development", description: "Prompts for software architecture, coding, and debugging", color: "#3b82f6", icon: "Code2" },
        { name: "Writing & Content", description: "Creative and technical copywriting, summaries, and edits", color: "#10b981", icon: "PenTool" },
        { name: "System Architecture", description: "DevOps, infrastructure, security standards, and system design", color: "#8b5cf6", icon: "Server" },
        { name: "General AI", description: "General queries, reasoning, and ad-hoc task prompts", color: "#f59e0b", icon: "Sparkles" },
      ],
    });
  }

  // Seed default tags if none exist
  const tagCount = await prisma.tag.count();
  if (tagCount === 0) {
    await prisma.tag.createMany({
      data: [
        { name: "nextjs", color: "#000000" },
        { name: "typescript", color: "#3178c6" },
        { name: "security", color: "#ef4444" },
        { name: "master-rule", color: "#8b5cf6" },
        { name: "architecture", color: "#06b6d4" },
      ],
    });
  }

  return {
    initialized: true,
    adminEmail,
    adminCreated,
    message: adminCreated ? "System bootstrapped with initial admin" : "System already initialized",
  };
}
