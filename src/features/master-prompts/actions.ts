"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import {
  masterPromptSchema,
  reusableRuleSchema,
  type MasterPromptInput,
  type ReusableRuleInput,
} from "@/lib/validations/advanced";
import { logActivity } from "@/lib/activity";

export async function createMasterPromptAction(input: MasterPromptInput): Promise<{ success: boolean; id?: string; error?: string }> {
  await requireAuth();

  const val = masterPromptSchema.safeParse(input);
  if (!val.success) {
    return { success: false, error: val.error.issues[0]?.message };
  }

  try {
    const item = await prisma.masterPrompt.create({
      data: {
        title: val.data.title,
        description: val.data.description || null,
        content: val.data.content,
        isGlobal: val.data.isGlobal,
        workspaceId: val.data.workspaceId || null,
        isActive: val.data.isActive,
      },
    });

    await logActivity({ action: "master_prompt_created", entityType: "master_prompt", entityId: item.id });
    revalidatePath("/master-prompts");
    return { success: true, id: item.id };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to create master prompt" };
  }
}

export async function updateMasterPromptAction(id: string, input: MasterPromptInput): Promise<{ success: boolean; error?: string }> {
  await requireAuth();

  const val = masterPromptSchema.safeParse(input);
  if (!val.success) {
    return { success: false, error: val.error.issues[0]?.message };
  }

  try {
    await prisma.masterPrompt.update({
      where: { id },
      data: {
        title: val.data.title,
        description: val.data.description || null,
        content: val.data.content,
        isGlobal: val.data.isGlobal,
        workspaceId: val.data.workspaceId || null,
        isActive: val.data.isActive,
        version: { increment: 1 },
      },
    });

    revalidatePath("/master-prompts");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update master prompt" };
  }
}

export async function deleteMasterPromptAction(id: string): Promise<{ success: boolean; error?: string }> {
  await requireAuth();

  try {
    await prisma.masterPrompt.delete({ where: { id } });
    revalidatePath("/master-prompts");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete master prompt" };
  }
}

export async function createReusableRuleAction(input: ReusableRuleInput): Promise<{ success: boolean; id?: string; error?: string }> {
  await requireAuth();

  const val = reusableRuleSchema.safeParse(input);
  if (!val.success) {
    return { success: false, error: val.error.issues[0]?.message };
  }

  try {
    const item = await prisma.reusableRule.create({
      data: {
        title: val.data.title,
        category: val.data.category,
        content: val.data.content,
        priority: val.data.priority,
        isEnabled: val.data.isEnabled,
        isGlobal: val.data.isGlobal,
        workspaceId: val.data.workspaceId || null,
      },
    });

    await logActivity({ action: "reusable_rule_created", entityType: "reusable_rule", entityId: item.id });
    revalidatePath("/master-prompts");
    return { success: true, id: item.id };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to create reusable rule" };
  }
}

export async function updateReusableRuleAction(id: string, input: ReusableRuleInput): Promise<{ success: boolean; error?: string }> {
  await requireAuth();

  const val = reusableRuleSchema.safeParse(input);
  if (!val.success) {
    return { success: false, error: val.error.issues[0]?.message };
  }

  try {
    await prisma.reusableRule.update({
      where: { id },
      data: {
        title: val.data.title,
        category: val.data.category,
        content: val.data.content,
        priority: val.data.priority,
        isEnabled: val.data.isEnabled,
        isGlobal: val.data.isGlobal,
        workspaceId: val.data.workspaceId || null,
        version: { increment: 1 },
      },
    });

    revalidatePath("/master-prompts");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update reusable rule" };
  }
}

export async function toggleReusableRuleAction(id: string): Promise<{ success: boolean; isEnabled: boolean }> {
  await requireAuth();

  const rule = await prisma.reusableRule.findUnique({ where: { id } });
  if (!rule) throw new Error("Rule not found");

  const updated = await prisma.reusableRule.update({
    where: { id },
    data: { isEnabled: !rule.isEnabled },
  });

  revalidatePath("/master-prompts");
  return { success: true, isEnabled: updated.isEnabled };
}

export async function deleteReusableRuleAction(id: string): Promise<{ success: boolean; error?: string }> {
  await requireAuth();

  try {
    await prisma.reusableRule.delete({ where: { id } });
    revalidatePath("/master-prompts");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete reusable rule" };
  }
}

export async function reorderReusableRulesAction(items: { id: string; priority: number }[]): Promise<{ success: boolean }> {
  await requireAuth();

  await prisma.$transaction(
    items.map((item) =>
      prisma.reusableRule.update({
        where: { id: item.id },
        data: { priority: item.priority },
      })
    )
  );

  revalidatePath("/master-prompts");
  return { success: true };
}
