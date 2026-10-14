import React from "react";
import prisma from "@/lib/db";
import { getStorageStatsAction } from "@/features/backup/actions";
import { StorageSettingsView } from "./storage-settings-view";

export default async function StorageSettingsPage() {
  const [statsRes, folders, categories, workspaces] = await Promise.all([
    getStorageStatsAction(),
    prisma.folder.findMany({ select: { id: true, name: true } }),
    prisma.category.findMany({ select: { id: true, name: true } }),
    prisma.workspace.findMany({
      where: { isArchived: false },
      select: { id: true, name: true },
    }),
  ]);

  const initialStats = statsRes.stats || {
    databaseSizeBytes: 0,
    uploadsSizeBytes: 0,
    counts: {
      prompts: 0,
      activePrompts: 0,
      trashedPrompts: 0,
      versions: 0,
      folders: 0,
      categories: 0,
      tags: 0,
      workspaces: 0,
      templates: 0,
      masterPrompts: 0,
      reusableRules: 0,
      attachments: 0,
      activityLogs: 0,
      aiTestResults: 0,
    },
  };

  return (
    <StorageSettingsView
      initialStats={initialStats}
      folders={folders}
      categories={categories}
      workspaces={workspaces}
    />
  );
}
