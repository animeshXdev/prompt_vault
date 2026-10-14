"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { encryptSecret } from "@/lib/security/crypto";
import { executeAIRequest } from "@/lib/ai/service";
import { logActivity } from "@/lib/activity";

export async function updateAppSettingsAction(data: {
  appName?: string;
  defaultWorkspaceId?: string | null;
  defaultAiPlatform?: string | null;
  defaultCategoryId?: string | null;
  editorFontSize?: number;
  autosaveInterval?: number;
  defaultEditorMode?: string;
  themePreference?: string;
  sessionExpirationDays?: number;
}): Promise<{ success: boolean; error?: string }> {
  await requireAuth();

  try {
    await prisma.applicationSettings.upsert({
      where: { id: "default" },
      create: {
        id: "default",
        ...data,
      },
      update: {
        ...data,
      },
    });

    await logActivity({ action: "settings_updated", entityType: "settings" });
    revalidatePath("/settings");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update settings" };
  }
}

export async function saveAiProviderConfigAction(data: {
  provider: string;
  isEnabled: boolean;
  apiKey?: string;
  baseUrl?: string | null;
  defaultModel?: string | null;
}): Promise<{ success: boolean; error?: string }> {
  await requireAuth();

  try {
    const existing = await prisma.aIProviderConfiguration.findUnique({
      where: { provider: data.provider },
    });

    let encryptedApiKey = existing?.encryptedApiKey || null;
    if (data.apiKey && data.apiKey.trim()) {
      encryptedApiKey = encryptSecret(data.apiKey.trim());
    }

    await prisma.aIProviderConfiguration.upsert({
      where: { provider: data.provider },
      create: {
        provider: data.provider,
        isEnabled: data.isEnabled,
        encryptedApiKey,
        baseUrl: data.baseUrl || null,
        defaultModel: data.defaultModel || null,
      },
      update: {
        isEnabled: data.isEnabled,
        encryptedApiKey,
        baseUrl: data.baseUrl || null,
        defaultModel: data.defaultModel || null,
      },
    });

    await logActivity({ action: "ai_provider_configured", entityType: "ai_provider", details: { provider: data.provider, isEnabled: data.isEnabled } });

    revalidatePath("/settings/ai");
    revalidatePath("/playground");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to save AI configuration" };
  }
}

export async function deleteAiProviderConfigAction(provider: string): Promise<{ success: boolean; error?: string }> {
  await requireAuth();

  try {
    await prisma.aIProviderConfiguration.delete({
      where: { provider },
    });

    await logActivity({ action: "ai_provider_deleted", entityType: "ai_provider", details: { provider } });
    revalidatePath("/settings/ai");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete AI configuration" };
  }
}

export async function testAiConnectivityAction(provider: string): Promise<{ success: boolean; message: string }> {
  await requireAuth();

  const res = await executeAIRequest({
    provider: provider as any,
    userPrompt: "Respond with the word 'OK' to verify connectivity.",
    maxTokens: 10,
    temperature: 0,
  });

  if (!res.success) {
    return { success: false, message: res.error || "Connection test failed." };
  }

  return { success: true, message: `Connected successfully! Response: ${res.content?.trim()} (Latency: ${res.latencyMs}ms)` };
}

export async function clearSelectedDataAction(options: {
  clearPrompts?: boolean;
  clearTrash?: boolean;
  clearActivityLogs?: boolean;
  clearAiHistory?: boolean;
}): Promise<{ success: boolean; message: string }> {
  await requireAuth();

  const clearedItems: string[] = [];

  if (options.clearTrash) {
    const res = await prisma.prompt.deleteMany({ where: { isDeleted: true } });
    clearedItems.push(`${res.count} trashed prompts`);
  }

  if (options.clearPrompts) {
    const res = await prisma.prompt.deleteMany();
    clearedItems.push(`${res.count} prompts`);
  }

  if (options.clearActivityLogs) {
    const res = await prisma.activityLog.deleteMany();
    clearedItems.push(`${res.count} activity logs`);
  }

  if (options.clearAiHistory) {
    const res = await prisma.aITestResult.deleteMany();
    clearedItems.push(`${res.count} AI playground test records`);
  }

  await logActivity({
    action: "data_cleared",
    entityType: "system",
    details: { cleared: clearedItems },
  });

  revalidatePath("/dashboard");
  revalidatePath("/prompts");
  revalidatePath("/trash");
  revalidatePath("/activity");
  revalidatePath("/analytics");

  return { success: true, message: `Successfully cleared: ${clearedItems.join(", ") || "nothing"}` };
}
