"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { workspaceSchema, type WorkspaceInput } from "@/lib/validations/organization";
import { slugify } from "@/lib/utils";
import { logActivity } from "@/lib/activity";

export async function createWorkspaceAction(input: WorkspaceInput): Promise<{ success: boolean; workspaceId?: string; error?: string }> {
  await requireAuth();

  const val = workspaceSchema.safeParse(input);
  if (!val.success) {
    return { success: false, error: val.error.issues[0]?.message };
  }

  const baseSlug = slugify(val.data.name);
  let slug = baseSlug;
  let counter = 1;

  while (await prisma.workspace.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter++}`;
  }

  try {
    const ws = await prisma.workspace.create({
      data: {
        name: val.data.name,
        slug,
        description: val.data.description || null,
        projectType: val.data.projectType || null,
        technologyStack: val.data.technologyStack || null,
        customInstructions: val.data.customInstructions || null,
        masterPrompt: val.data.masterPrompt || null,
        settings: {
          create: {},
        },
      },
    });

    await logActivity({ action: "workspace_created", entityType: "workspace", entityId: ws.id, details: { name: ws.name } });

    revalidatePath("/workspaces");
    return { success: true, workspaceId: ws.id };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to create workspace" };
  }
}

export async function updateWorkspaceAction(id: string, input: WorkspaceInput): Promise<{ success: boolean; error?: string }> {
  await requireAuth();

  const val = workspaceSchema.safeParse(input);
  if (!val.success) {
    return { success: false, error: val.error.issues[0]?.message };
  }

  try {
    await prisma.workspace.update({
      where: { id },
      data: {
        name: val.data.name,
        description: val.data.description || null,
        projectType: val.data.projectType || null,
        technologyStack: val.data.technologyStack || null,
        customInstructions: val.data.customInstructions || null,
        masterPrompt: val.data.masterPrompt || null,
      },
    });

    await logActivity({ action: "workspace_updated", entityType: "workspace", entityId: id });

    revalidatePath("/workspaces");
    revalidatePath(`/workspaces/${id}`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update workspace" };
  }
}

export async function toggleArchiveWorkspaceAction(id: string): Promise<{ success: boolean; isArchived: boolean }> {
  await requireAuth();

  const ws = await prisma.workspace.findUnique({ where: { id } });
  if (!ws) throw new Error("Workspace not found");

  const updated = await prisma.workspace.update({
    where: { id },
    data: { isArchived: !ws.isArchived },
  });

  revalidatePath("/workspaces");
  revalidatePath(`/workspaces/${id}`);
  return { success: true, isArchived: updated.isArchived };
}

export async function duplicateWorkspaceAction(id: string): Promise<{ success: boolean; workspaceId?: string; error?: string }> {
  await requireAuth();

  const source = await prisma.workspace.findUnique({
    where: { id },
  });

  if (!source) {
    return { success: false, error: "Workspace not found" };
  }

  return createWorkspaceAction({
    name: `${source.name} (Copy)`,
    description: source.description,
    projectType: source.projectType,
    technologyStack: source.technologyStack,
    customInstructions: source.customInstructions,
    masterPrompt: source.masterPrompt,
  });
}

export async function deleteWorkspaceAction(id: string): Promise<{ success: boolean; error?: string }> {
  await requireAuth();

  try {
    await prisma.workspace.delete({ where: { id } });
    await logActivity({ action: "workspace_deleted", entityType: "workspace", entityId: id });

    revalidatePath("/workspaces");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete workspace" };
  }
}
