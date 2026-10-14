"use server";

import fs from "node:fs/promises";
import path from "node:path";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import {
  parsePromptFromJson,
  parsePromptFromMarkdown,
  detectDuplicates,
  executeImport,
  type ParsedImportItem,
} from "@/lib/backup/import-export";
import { getUploadDirectory } from "@/lib/storage/attachments";

export interface StorageStats {
  databaseSizeBytes: number;
  uploadsSizeBytes: number;
  counts: {
    prompts: number;
    activePrompts: number;
    trashedPrompts: number;
    versions: number;
    folders: number;
    categories: number;
    tags: number;
    workspaces: number;
    templates: number;
    masterPrompts: number;
    reusableRules: number;
    attachments: number;
    activityLogs: number;
    aiTestResults: number;
  };
}

async function getDirectorySize(dirPath: string): Promise<number> {
  let totalSize = 0;
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        totalSize += await getDirectorySize(fullPath);
      } else if (entry.isFile()) {
        const stat = await fs.stat(fullPath);
        totalSize += stat.size;
      }
    }
  } catch {
    // Directory might not exist yet
  }
  return totalSize;
}

export async function getStorageStatsAction(): Promise<{ success: boolean; stats?: StorageStats; error?: string }> {
  await requireAuth();

  try {
    // Database file size
    let databaseSizeBytes = 0;
    try {
      const dbPath = path.resolve(process.cwd(), "dev.db");
      const stat = await fs.stat(dbPath);
      databaseSizeBytes = stat.size;
    } catch {
      // fallback
    }

    // Uploads size
    const uploadDir = getUploadDirectory();
    const uploadsSizeBytes = await getDirectorySize(uploadDir);

    // Entity counts
    const [
      prompts,
      activePrompts,
      trashedPrompts,
      versions,
      folders,
      categories,
      tags,
      workspaces,
      templates,
      masterPrompts,
      reusableRules,
      attachments,
      activityLogs,
      aiTestResults,
    ] = await Promise.all([
      prisma.prompt.count(),
      prisma.prompt.count({ where: { isDeleted: false } }),
      prisma.prompt.count({ where: { isDeleted: true } }),
      prisma.promptVersion.count(),
      prisma.folder.count(),
      prisma.category.count(),
      prisma.tag.count(),
      prisma.workspace.count(),
      prisma.promptTemplate.count(),
      prisma.masterPrompt.count(),
      prisma.reusableRule.count(),
      prisma.attachment.count(),
      prisma.activityLog.count(),
      prisma.aITestResult.count(),
    ]);

    return {
      success: true,
      stats: {
        databaseSizeBytes,
        uploadsSizeBytes,
        counts: {
          prompts,
          activePrompts,
          trashedPrompts,
          versions,
          folders,
          categories,
          tags,
          workspaces,
          templates,
          masterPrompts,
          reusableRules,
          attachments,
          activityLogs,
          aiTestResults,
        },
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to load storage statistics" };
  }
}

export async function parseImportFileAction(
  rawContent: string,
  filename: string
): Promise<{ success: boolean; items?: ParsedImportItem[]; error?: string }> {
  await requireAuth();

  try {
    let items: ParsedImportItem[] = [];
    if (filename.toLowerCase().endsWith(".json")) {
      items = parsePromptFromJson(rawContent);
    } else {
      items = parsePromptFromMarkdown(filename, rawContent);
    }

    if (items.length === 0) {
      return { success: false, error: "No valid prompts found in file" };
    }

    const withDuplicates = await detectDuplicates(items);
    return { success: true, items: withDuplicates };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to parse import file" };
  }
}

export async function executeImportAction(
  items: ParsedImportItem[],
  options?: { folderId?: string; workspaceId?: string; categoryId?: string }
): Promise<{ success: boolean; importedCount: number; errors: string[] }> {
  await requireAuth();

  try {
    const result = await executeImport(items, options);
    revalidatePath("/prompts");
    revalidatePath("/dashboard");
    revalidatePath("/folders");
    revalidatePath("/categories");
    revalidatePath("/workspaces");
    return { success: true, ...result };
  } catch (err: any) {
    return { success: false, importedCount: 0, errors: [err.message || "Import execution failed"] };
  }
}
