import prisma from "@/lib/db";
import { hashPassword } from "@/lib/security/crypto";

export interface BootstrapResult {
  initialized: boolean;
  adminEmail: string;
  adminCreated: boolean;
  message: string;
}

const SCHEMA_TABLES_SQL = [
  `CREATE TABLE IF NOT EXISTS "Administrator" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastLoginAt" DATETIME
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Administrator_email_key" ON "Administrator"("email")`,
  `CREATE TABLE IF NOT EXISTS "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActiveAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Session_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Administrator" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Session_token_key" ON "Session"("token")`,
  `CREATE INDEX IF NOT EXISTS "Session_token_idx" ON "Session"("token")`,
  `CREATE TABLE IF NOT EXISTS "ApplicationSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "appName" TEXT NOT NULL DEFAULT 'PromptVault',
    "defaultWorkspaceId" TEXT,
    "defaultAiPlatform" TEXT DEFAULT 'openai',
    "defaultCategoryId" TEXT,
    "editorFontSize" INTEGER NOT NULL DEFAULT 14,
    "autosaveInterval" INTEGER NOT NULL DEFAULT 1000,
    "defaultEditorMode" TEXT NOT NULL DEFAULT 'split',
    "markdownPreviewTheme" TEXT NOT NULL DEFAULT 'github',
    "sessionExpirationDays" INTEGER NOT NULL DEFAULT 30,
    "storagePath" TEXT NOT NULL DEFAULT './data/uploads',
    "themePreference" TEXT NOT NULL DEFAULT 'system',
    "updatedAt" DATETIME NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "Workspace" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "projectType" TEXT,
    "technologyStack" TEXT,
    "customInstructions" TEXT,
    "masterPrompt" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Workspace_slug_key" ON "Workspace"("slug")`,
  `CREATE TABLE IF NOT EXISTS "WorkspaceSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT NOT NULL,
    "defaultAiModel" TEXT,
    "customRulesJson" TEXT,
    "metadataJson" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WorkspaceSettings_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "WorkspaceSettings_workspaceId_key" ON "WorkspaceSettings"("workspaceId")`,
  `CREATE TABLE IF NOT EXISTS "Folder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "icon" TEXT,
    "parentId" TEXT,
    "workspaceId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Folder_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Folder" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Folder_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "icon" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Category_name_key" ON "Category"("name")`,
  `CREATE TABLE IF NOT EXISTS "Tag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Tag_name_key" ON "Tag"("name")`,
  `CREATE TABLE IF NOT EXISTS "PromptTag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "promptId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    CONSTRAINT "PromptTag_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "Prompt" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PromptTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "Prompt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT NOT NULL,
    "notes" TEXT,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'active',
    "copyCount" INTEGER NOT NULL DEFAULT 0,
    "targetPlatform" TEXT,
    "targetModel" TEXT,
    "estimatedTokens" INTEGER NOT NULL DEFAULT 0,
    "folderId" TEXT,
    "categoryId" TEXT,
    "workspaceId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Prompt_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "Folder" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Prompt_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Prompt_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE SET NULL ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "PromptVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "promptId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "notes" TEXT,
    "changeNotes" TEXT,
    "isStable" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PromptVersion_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "Prompt" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "MasterPrompt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT NOT NULL,
    "isGlobal" BOOLEAN NOT NULL DEFAULT true,
    "workspaceId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MasterPrompt_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "ReusableRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "isGlobal" BOOLEAN NOT NULL DEFAULT true,
    "workspaceId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ReusableRule_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "PromptTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "templateContent" TEXT NOT NULL,
    "workspaceId" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PromptTemplate_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE SET NULL ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "TemplateVariable" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "templateId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "fieldType" TEXT NOT NULL DEFAULT 'text',
    "defaultValue" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "optionsJson" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "TemplateVariable_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "PromptTemplate" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "TemplatePreset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "templateId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "valuesJson" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TemplatePreset_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "PromptTemplate" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "PromptComposition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "workspaceId" TEXT,
    "cachedCombinedText" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PromptComposition_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE SET NULL ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "CompositionBlock" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "compositionId" TEXT NOT NULL,
    "blockType" TEXT NOT NULL,
    "referenceId" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "CompositionBlock_compositionId_fkey" FOREIGN KEY ("compositionId") REFERENCES "PromptComposition" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "Attachment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "storagePath" TEXT NOT NULL,
    "promptId" TEXT,
    "workspaceId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Attachment_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "Prompt" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Attachment_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "ActivityLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "detailsJson" TEXT,
    "ipAddress" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "PromptUsageEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "promptId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "format" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PromptUsageEvent_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "Prompt" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "AITestResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "promptId" TEXT,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "inputPrompt" TEXT NOT NULL,
    "outputResponse" TEXT NOT NULL,
    "promptTokens" INTEGER,
    "completionTokens" INTEGER,
    "totalTokens" INTEGER,
    "estimatedCost" REAL,
    "latencyMs" INTEGER,
    "rating" INTEGER,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AITestResult_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "Prompt" ("id") ON DELETE SET NULL ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "AIProviderConfiguration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "provider" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "encryptedApiKey" TEXT,
    "baseUrl" TEXT,
    "defaultModel" TEXT,
    "modelsJson" TEXT,
    "pricingJson" TEXT,
    "updatedAt" DATETIME NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "AIProviderConfiguration_provider_key" ON "AIProviderConfiguration"("provider")`
];

export async function ensureDatabaseSchema(): Promise<void> {
  for (const sql of SCHEMA_TABLES_SQL) {
    try {
      await prisma.$executeRawUnsafe(sql);
    } catch {
      // Individual table or index may already exist; continue to the next
    }
  }
}

/**
 * Initializes the database on startup.
 * Automatically runs schema creation if tables don't exist.
 * The environment password is ONLY an initial bootstrap credential.
 * Once changed inside the app, database password remains authoritative.
 */
export async function bootstrapSystem(): Promise<BootstrapResult> {
  // 1. Ensure all tables exist in the database (SQLite / LibSQL / Turso)
  await ensureDatabaseSchema();

  let adminCreated = false;
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase() || "admin@example.com";

  let adminCount = 0;
  try {
    adminCount = await prisma.administrator.count();
  } catch {
    // Retry schema creation if count fails
    await ensureDatabaseSchema();
    adminCount = await prisma.administrator.count().catch(() => 0);
  }

  if (adminCount === 0) {
    const rawDefaultPassword = process.env.ADMIN_DEFAULT_PASSWORD || "AdminVault2026!Secure";
    const passwordHash = await hashPassword(rawDefaultPassword);

    try {
      await prisma.administrator.create({
        data: {
          email: adminEmail,
          passwordHash,
        },
      });
      adminCreated = true;
      console.log(`[PromptVault] Initial administrator created for ${adminEmail}`);
    } catch {
      // Handled if created concurrently
    }
  } else {
    // If the administrator email in .env was changed, sync it to the database
    const existingAdmin = await prisma.administrator.findFirst().catch(() => null);
    if (existingAdmin && existingAdmin.email !== adminEmail) {
      await prisma.administrator.update({
        where: { id: existingAdmin.id },
        data: { email: adminEmail },
      }).catch(() => {});
      console.log(`[PromptVault] Administrator email synchronized from .env: ${existingAdmin.email} -> ${adminEmail}`);
    }
  }

  // Ensure default application settings exist
  const existingSettings = await prisma.applicationSettings.findUnique({
    where: { id: "default" },
  }).catch(() => null);

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
    }).catch(() => {});
  }

  // Seed default categories if none exist
  const categoryCount = await prisma.category.count().catch(() => 0);
  if (categoryCount === 0) {
    await prisma.category.createMany({
      data: [
        { name: "Development", description: "Prompts for software architecture, coding, and debugging", color: "#3b82f6", icon: "Code2" },
        { name: "Writing & Content", description: "Creative and technical copywriting, summaries, and edits", color: "#10b981", icon: "PenTool" },
        { name: "System Architecture", description: "DevOps, infrastructure, security standards, and system design", color: "#8b5cf6", icon: "Server" },
        { name: "General AI", description: "General queries, reasoning, and ad-hoc task prompts", color: "#f59e0b", icon: "Sparkles" },
      ],
    }).catch(() => {});
  }

  // Seed default tags if none exist
  const tagCount = await prisma.tag.count().catch(() => 0);
  if (tagCount === 0) {
    await prisma.tag.createMany({
      data: [
        { name: "nextjs", color: "#000000" },
        { name: "typescript", color: "#3178c6" },
        { name: "security", color: "#ef4444" },
        { name: "master-rule", color: "#8b5cf6" },
        { name: "architecture", color: "#06b6d4" },
      ],
    }).catch(() => {});
  }

  return {
    initialized: true,
    adminEmail,
    adminCreated,
    message: adminCreated ? "System bootstrapped with initial admin" : "System already initialized",
  };
}
