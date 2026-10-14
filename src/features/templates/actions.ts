"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { promptTemplateSchema, type PromptTemplateInput } from "@/lib/validations/advanced";
import { extractVariables } from "@/lib/templates/engine";
import { logActivity } from "@/lib/activity";

export async function createTemplateAction(input: PromptTemplateInput): Promise<{ success: boolean; templateId?: string; error?: string }> {
  await requireAuth();

  const val = promptTemplateSchema.safeParse(input);
  if (!val.success) {
    return { success: false, error: val.error.issues[0]?.message };
  }

  const { title, description, templateContent, workspaceId, variables } = val.data;

  // Auto-detect any variables in the template string that weren't explicitly supplied
  const detectedVarNames = extractVariables(templateContent);
  const existingMap = new Map(variables.map((v) => [v.name, v]));

  const mergedVariables = detectedVarNames.map((name, index) => {
    const existing = existingMap.get(name);
    if (existing) {
      return { ...existing, orderIndex: index };
    }
    return {
      name,
      label: name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      description: null as string | null,
      fieldType: "text" as const,
      isRequired: false,
      defaultValue: null as string | null,
      optionsJson: null as string | null,
      orderIndex: index,
    };
  });

  try {
    const template = await prisma.$transaction(async (tx) => {
      const created = await tx.promptTemplate.create({
        data: {
          title,
          description: description || null,
          templateContent,
          workspaceId: workspaceId || null,
        },
      });

      if (mergedVariables.length > 0) {
        await tx.templateVariable.createMany({
          data: mergedVariables.map((v) => ({
            templateId: created.id,
            name: v.name,
            label: v.label,
            description: v.description || null,
            fieldType: v.fieldType || "text",
            defaultValue: v.defaultValue || null,
            isRequired: !!v.isRequired,
            optionsJson: (v as any).options ? JSON.stringify((v as any).options) : null,
            orderIndex: v.orderIndex,
          })),
        });
      }

      return created;
    });

    await logActivity({ action: "template_created", entityType: "template", entityId: template.id, details: { title: template.title } });

    revalidatePath("/templates");
    return { success: true, templateId: template.id };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to create template" };
  }
}

export async function updateTemplateAction(id: string, input: PromptTemplateInput): Promise<{ success: boolean; error?: string }> {
  await requireAuth();

  const val = promptTemplateSchema.safeParse(input);
  if (!val.success) {
    return { success: false, error: val.error.issues[0]?.message };
  }

  const { title, description, templateContent, workspaceId, variables } = val.data;

  const detectedVarNames = extractVariables(templateContent);
  const existingMap = new Map(variables.map((v) => [v.name, v]));

  const mergedVariables = detectedVarNames.map((name, index) => {
    const existing = existingMap.get(name);
    if (existing) {
      return { ...existing, orderIndex: index };
    }
    return {
      name,
      label: name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      description: null as string | null,
      fieldType: "text" as const,
      isRequired: false,
      defaultValue: null as string | null,
      optionsJson: null as string | null,
      orderIndex: index,
    };
  });

  try {
    await prisma.$transaction(async (tx) => {
      await tx.promptTemplate.update({
        where: { id },
        data: {
          title,
          description: description || null,
          templateContent,
          workspaceId: workspaceId || null,
        },
      });

      // Replace variables with updated set
      await tx.templateVariable.deleteMany({ where: { templateId: id } });

      if (mergedVariables.length > 0) {
        await tx.templateVariable.createMany({
          data: mergedVariables.map((v) => ({
            templateId: id,
            name: v.name,
            label: v.label,
            description: v.description || null,
            fieldType: v.fieldType || "text",
            defaultValue: v.defaultValue || null,
            isRequired: !!v.isRequired,
            optionsJson: (v as any).options ? JSON.stringify((v as any).options) : null,
            orderIndex: v.orderIndex,
          })),
        });
      }
    });

    await logActivity({ action: "template_updated", entityType: "template", entityId: id });

    revalidatePath("/templates");
    revalidatePath(`/templates/${id}`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update template" };
  }
}

export async function deleteTemplateAction(id: string): Promise<{ success: boolean; error?: string }> {
  await requireAuth();

  try {
    await prisma.promptTemplate.delete({ where: { id } });
    await logActivity({ action: "template_deleted", entityType: "template", entityId: id });

    revalidatePath("/templates");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete template" };
  }
}

export async function saveTemplatePresetAction(
  templateId: string,
  name: string,
  values: Record<string, string>
): Promise<{ success: boolean; presetId?: string; error?: string }> {
  await requireAuth();

  if (!name.trim()) {
    return { success: false, error: "Preset name is required" };
  }

  try {
    const preset = await prisma.templatePreset.create({
      data: {
        templateId,
        name: name.trim(),
        valuesJson: JSON.stringify(values),
      },
    });

    revalidatePath(`/templates/${templateId}`);
    return { success: true, presetId: preset.id };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to save preset" };
  }
}
