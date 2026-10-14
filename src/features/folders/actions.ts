"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { folderSchema, type FolderInput } from "@/lib/validations/organization";
import { logActivity } from "@/lib/activity";

export async function createFolderAction(input: FolderInput): Promise<{ success: boolean; folderId?: string; error?: string }> {
  await requireAuth();

  const val = folderSchema.safeParse(input);
  if (!val.success) {
    return { success: false, error: val.error.issues[0]?.message };
  }

  try {
    const folder = await prisma.folder.create({
      data: {
        name: val.data.name,
        description: val.data.description || null,
        color: val.data.color || "#6366f1",
        icon: val.data.icon || "Folder",
        parentId: val.data.parentId || null,
        workspaceId: val.data.workspaceId || null,
      },
    });

    await logActivity({ action: "folder_created", entityType: "folder", entityId: folder.id, details: { name: folder.name } });

    revalidatePath("/folders");
    revalidatePath("/prompts");
    return { success: true, folderId: folder.id };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to create folder" };
  }
}

export async function updateFolderAction(id: string, input: FolderInput): Promise<{ success: boolean; error?: string }> {
  await requireAuth();

  const val = folderSchema.safeParse(input);
  if (!val.success) {
    return { success: false, error: val.error.issues[0]?.message };
  }

  try {
    // Prevent setting self as parent
    if (val.data.parentId === id) {
      return { success: false, error: "A folder cannot be its own parent" };
    }

    await prisma.folder.update({
      where: { id },
      data: {
        name: val.data.name,
        description: val.data.description || null,
        color: val.data.color || null,
        icon: val.data.icon || null,
        parentId: val.data.parentId || null,
        workspaceId: val.data.workspaceId || null,
      },
    });

    revalidatePath("/folders");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update folder" };
  }
}

export async function deleteFolderAction(
  id: string,
  reassignToFolderId?: string | null
): Promise<{ success: boolean; error?: string }> {
  await requireAuth();

  try {
    await prisma.$transaction(async (tx) => {
      // Reassign all prompts from this folder to target folder or unassigned
      await tx.prompt.updateMany({
        where: { folderId: id },
        data: { folderId: reassignToFolderId || null },
      });

      // Reassign any child folders to null or target
      await tx.folder.updateMany({
        where: { parentId: id },
        data: { parentId: reassignToFolderId || null },
      });

      // Delete folder
      await tx.folder.delete({ where: { id } });
    });

    await logActivity({ action: "folder_deleted", entityType: "folder", entityId: id });

    revalidatePath("/folders");
    revalidatePath("/prompts");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete folder" };
  }
}
