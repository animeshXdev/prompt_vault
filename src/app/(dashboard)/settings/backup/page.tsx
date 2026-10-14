import React from "react";
import prisma from "@/lib/db";
import { BackupSettingsView } from "./backup-settings-view";

export default async function BackupSettingsPage() {
  const [
    promptsCount,
    versionsCount,
    attachmentsCount,
    workspacesCount,
    templatesCount,
    masterPromptsCount,
    recentBackups,
  ] = await Promise.all([
    prisma.prompt.count(),
    prisma.promptVersion.count(),
    prisma.attachment.count(),
    prisma.workspace.count(),
    prisma.promptTemplate.count(),
    prisma.masterPrompt.count(),
    prisma.activityLog.findMany({
      where: {
        action: { in: ["backup_created", "backup_restored"] },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        action: true,
        createdAt: true,
        detailsJson: true,
      },
    }),
  ]);

  return (
    <BackupSettingsView
      recordCounts={{
        prompts: promptsCount,
        versions: versionsCount,
        attachments: attachmentsCount,
        workspaces: workspacesCount,
        templates: templatesCount,
        masterPrompts: masterPromptsCount,
      }}
      recentBackups={recentBackups}
    />
  );
}
