import React from "react";
import prisma from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { GeneralSettingsForm } from "./general-settings-form";

export default async function SettingsPage() {
  const session = await getSession();

  const [settings, workspaces, categories] = await Promise.all([
    prisma.applicationSettings.findUnique({
      where: { id: "default" },
    }),
    prisma.workspace.findMany({
      where: { isArchived: false },
      select: { id: true, name: true },
    }),
    prisma.category.findMany({
      select: { id: true, name: true },
    }),
  ]);

  const defaultSettings = {
    appName: settings?.appName || "PromptVault",
    defaultWorkspaceId: settings?.defaultWorkspaceId,
    defaultAiPlatform: settings?.defaultAiPlatform,
    defaultCategoryId: settings?.defaultCategoryId,
    themePreference: settings?.themePreference || "system",
  };

  return (
    <GeneralSettingsForm
      adminEmail={session?.admin.email || "admin@example.com"}
      settings={defaultSettings}
      workspaces={workspaces}
      categories={categories}
    />
  );
}
