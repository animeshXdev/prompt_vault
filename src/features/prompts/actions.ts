"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { promptSchema, type PromptInput } from "@/lib/validations/prompt";
import { estimateTokenCount } from "@/lib/utils";
import { logActivity } from "@/lib/activity";

export async function createPromptAction(input: PromptInput): Promise<{ success: boolean; promptId?: string; error?: string }> {
  await requireAuth();

  const validation = promptSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0]?.message || "Validation failed" };
  }

  const data = validation.data;
  const estimatedTokens = estimateTokenCount(data.content);

  try {
    const prompt = await prisma.$transaction(async (tx) => {
      const created = await tx.prompt.create({
        data: {
          title: data.title,
          description: data.description || null,
          content: data.content,
          notes: data.notes || null,
          folderId: data.folderId || null,
          categoryId: data.categoryId || null,
          workspaceId: data.workspaceId || null,
          targetPlatform: data.targetPlatform || null,
          targetModel: data.targetModel || null,
          isFavorite: data.isFavorite,
          isPinned: data.isPinned,
          isArchived: data.isArchived,
          status: data.status,
          estimatedTokens,
        },
      });

      // Create Version 1 snapshot
      await tx.promptVersion.create({
        data: {
          promptId: created.id,
          versionNumber: 1,
          title: data.title,
          content: data.content,
          notes: data.notes || null,
          changeNotes: data.changeNotes || "Initial version",
          isStable: true,
        },
      });

      // Handle tags
      if (data.tags && data.tags.length > 0) {
        for (const tagName of data.tags) {
          const trimmed = tagName.trim();
          if (!trimmed) continue;

          let tag = await tx.tag.findUnique({ where: { name: trimmed } });
          if (!tag) {
            tag = await tx.tag.create({ data: { name: trimmed } });
          }

          await tx.promptTag.create({
            data: { promptId: created.id, tagId: tag.id },
          }).catch(() => {});
        }
      }

      return created;
    });

    await logActivity({
      action: "prompt_created",
      entityType: "prompt",
      entityId: prompt.id,
      details: { title: prompt.title },
    });

    revalidatePath("/prompts");
    revalidatePath("/dashboard");
    return { success: true, promptId: prompt.id };
  } catch (err: any) {
    console.error("Failed to create prompt:", err);
    return { success: false, error: err.message || "Failed to create prompt" };
  }
}

export async function updatePromptAction(
  id: string,
  input: PromptInput
): Promise<{ success: boolean; error?: string }> {
  await requireAuth();

  const validation = promptSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0]?.message || "Validation failed" };
  }

  const data = validation.data;
  const estimatedTokens = estimateTokenCount(data.content);

  try {
    const existing = await prisma.prompt.findUnique({
      where: { id },
      include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } },
    });

    if (!existing) {
      return { success: false, error: "Prompt not found" };
    }

    const contentChanged = existing.content !== data.content;
    const titleChanged = existing.title !== data.title;
    const shouldSnapshot = contentChanged || !!data.changeNotes;

    await prisma.$transaction(async (tx) => {
      // If content changed or explicit change notes provided, create new revision
      if (shouldSnapshot) {
        const lastVersionNum = existing.versions[0]?.versionNumber || 1;
        await tx.promptVersion.create({
          data: {
            promptId: id,
            versionNumber: lastVersionNum + 1,
            title: data.title,
            content: data.content,
            notes: data.notes || null,
            changeNotes: data.changeNotes || (contentChanged ? "Content updated" : "Metadata updated"),
          },
        });
      }

      // Sync tags
      await tx.promptTag.deleteMany({ where: { promptId: id } });
      if (data.tags && data.tags.length > 0) {
        for (const tagName of data.tags) {
          const trimmed = tagName.trim();
          if (!trimmed) continue;

          let tag = await tx.tag.findUnique({ where: { name: trimmed } });
          if (!tag) {
            tag = await tx.tag.create({ data: { name: trimmed } });
          }

          await tx.promptTag.create({
            data: { promptId: id, tagId: tag.id },
          }).catch(() => {});
        }
      }

      // Update prompt record
      await tx.prompt.update({
        where: { id },
        data: {
          title: data.title,
          description: data.description || null,
          content: data.content,
          notes: data.notes || null,
          folderId: data.folderId || null,
          categoryId: data.categoryId || null,
          workspaceId: data.workspaceId || null,
          targetPlatform: data.targetPlatform || null,
          targetModel: data.targetModel || null,
          isFavorite: data.isFavorite,
          isPinned: data.isPinned,
          isArchived: data.isArchived,
          status: data.status,
          estimatedTokens,
        },
      });
    });

    await logActivity({
      action: "prompt_updated",
      entityType: "prompt",
      entityId: id,
      details: { title: data.title, snapshotCreated: shouldSnapshot },
    });

    revalidatePath("/prompts");
    revalidatePath(`/prompts/${id}`);
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: any) {
    console.error("Failed to update prompt:", err);
    return { success: false, error: err.message || "Failed to update prompt" };
  }
}

export async function duplicatePromptAction(id: string): Promise<{ success: boolean; promptId?: string; error?: string }> {
  await requireAuth();

  const source = await prisma.prompt.findUnique({
    where: { id },
    include: { promptTags: { include: { tag: true } } },
  });

  if (!source) {
    return { success: false, error: "Prompt not found" };
  }

  const newTitle = `${source.title} (Copy)`;
  return createPromptAction({
    title: newTitle,
    description: source.description,
    content: source.content,
    notes: source.notes,
    folderId: source.folderId,
    categoryId: source.categoryId,
    workspaceId: source.workspaceId,
    targetPlatform: source.targetPlatform,
    targetModel: source.targetModel,
    isFavorite: false,
    isPinned: false,
    isArchived: false,
    status: source.status as any,
    tags: source.promptTags.map((pt) => pt.tag.name),
    changeNotes: `Duplicated from "${source.title}"`,
  });
}

export async function deletePromptAction(id: string, permanent = false): Promise<{ success: boolean; error?: string }> {
  await requireAuth();

  try {
    if (permanent) {
      await prisma.prompt.delete({ where: { id } });
      await logActivity({ action: "prompt_permanently_deleted", entityType: "prompt", entityId: id });
    } else {
      await prisma.prompt.update({
        where: { id },
        data: { isDeleted: true, deletedAt: new Date() },
      });
      await logActivity({ action: "prompt_trashed", entityType: "prompt", entityId: id });
    }

    revalidatePath("/prompts");
    revalidatePath("/trash");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete prompt" };
  }
}

export async function restorePromptAction(id: string): Promise<{ success: boolean; error?: string }> {
  await requireAuth();

  try {
    await prisma.prompt.update({
      where: { id },
      data: { isDeleted: false, deletedAt: null },
    });
    await logActivity({ action: "prompt_restored", entityType: "prompt", entityId: id });

    revalidatePath("/prompts");
    revalidatePath("/trash");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to restore prompt" };
  }
}

export async function toggleFavoriteAction(id: string): Promise<{ success: boolean; isFavorite: boolean }> {
  await requireAuth();

  const prompt = await prisma.prompt.findUnique({ where: { id }, select: { isFavorite: true } });
  if (!prompt) throw new Error("Prompt not found");

  const updated = await prisma.prompt.update({
    where: { id },
    data: { isFavorite: !prompt.isFavorite },
  });

  revalidatePath("/prompts");
  revalidatePath("/favorites");
  revalidatePath("/dashboard");
  return { success: true, isFavorite: updated.isFavorite };
}

export async function togglePinAction(id: string): Promise<{ success: boolean; isPinned: boolean }> {
  await requireAuth();

  const prompt = await prisma.prompt.findUnique({ where: { id }, select: { isPinned: true } });
  if (!prompt) throw new Error("Prompt not found");

  const updated = await prisma.prompt.update({
    where: { id },
    data: { isPinned: !prompt.isPinned },
  });

  revalidatePath("/prompts");
  revalidatePath("/pinned");
  revalidatePath("/dashboard");
  return { success: true, isPinned: updated.isPinned };
}

export async function toggleArchiveAction(id: string): Promise<{ success: boolean; isArchived: boolean }> {
  await requireAuth();

  const prompt = await prisma.prompt.findUnique({ where: { id }, select: { isArchived: true } });
  if (!prompt) throw new Error("Prompt not found");

  const updated = await prisma.prompt.update({
    where: { id },
    data: { isArchived: !prompt.isArchived },
  });

  revalidatePath("/prompts");
  revalidatePath("/archive");
  revalidatePath("/dashboard");
  return { success: true, isArchived: updated.isArchived };
}

export async function recordCopyAction(id: string, format: "markdown" | "plaintext" = "markdown"): Promise<{ count: number }> {
  // Can be called by authenticated user
  await requireAuth();

  const updated = await prisma.prompt.update({
    where: { id },
    data: {
      copyCount: { increment: 1 },
      usageEvents: {
        create: {
          eventType: "copy",
          format,
        },
      },
    },
    select: { copyCount: true },
  });

  return { count: updated.copyCount };
}

export async function restorePromptVersionAction(promptId: string, versionId: string): Promise<{ success: boolean; error?: string }> {
  await requireAuth();

  const version = await prisma.promptVersion.findUnique({
    where: { id: versionId },
  });

  if (!version || version.promptId !== promptId) {
    return { success: false, error: "Target version not found" };
  }

  const prompt = await prisma.prompt.findUnique({
    where: { id: promptId },
    include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } },
  });

  if (!prompt) {
    return { success: false, error: "Prompt not found" };
  }

  const nextVersionNum = (prompt.versions[0]?.versionNumber || 1) + 1;

  // CRITICAL RULE: Restore operation creates a new revision rather than destroying history
  await prisma.$transaction(async (tx) => {
    await tx.promptVersion.create({
      data: {
        promptId,
        versionNumber: nextVersionNum,
        title: version.title,
        content: version.content,
        notes: version.notes,
        changeNotes: `Restored from revision v${version.versionNumber}`,
      },
    });

    await tx.prompt.update({
      where: { id: promptId },
      data: {
        title: version.title,
        content: version.content,
        estimatedTokens: estimateTokenCount(version.content),
      },
    });
  });

  await logActivity({
    action: "version_restored",
    entityType: "prompt",
    entityId: promptId,
    details: { restoredFromVersion: version.versionNumber, newVersion: nextVersionNum },
  });

  revalidatePath(`/prompts/${promptId}`);
  return { success: true };
}

export async function bulkUpdatePromptsAction(
  promptIds: string[],
  action: "move_folder" | "archive" | "unarchive" | "trash" | "restore" | "delete_permanent",
  options?: { folderId?: string | null }
): Promise<{ success: boolean; affected: number; error?: string }> {
  await requireAuth();

  if (!promptIds.length) {
    return { success: false, affected: 0, error: "No prompts selected" };
  }

  try {
    let affected = 0;

    switch (action) {
      case "move_folder":
        const moveRes = await prisma.prompt.updateMany({
          where: { id: { in: promptIds } },
          data: { folderId: options?.folderId || null },
        });
        affected = moveRes.count;
        break;
      case "archive":
        const arcRes = await prisma.prompt.updateMany({
          where: { id: { in: promptIds } },
          data: { isArchived: true },
        });
        affected = arcRes.count;
        break;
      case "unarchive":
        const unarcRes = await prisma.prompt.updateMany({
          where: { id: { in: promptIds } },
          data: { isArchived: false },
        });
        affected = unarcRes.count;
        break;
      case "trash":
        const trashRes = await prisma.prompt.updateMany({
          where: { id: { in: promptIds } },
          data: { isDeleted: true, deletedAt: new Date() },
        });
        affected = trashRes.count;
        break;
      case "restore":
        const restoreRes = await prisma.prompt.updateMany({
          where: { id: { in: promptIds } },
          data: { isDeleted: false, deletedAt: null },
        });
        affected = restoreRes.count;
        break;
      case "delete_permanent":
        const delRes = await prisma.prompt.deleteMany({
          where: { id: { in: promptIds } },
        });
        affected = delRes.count;
        break;
    }

    revalidatePath("/prompts");
    revalidatePath("/trash");
    revalidatePath("/archive");
    revalidatePath("/dashboard");

    return { success: true, affected };
  } catch (err: any) {
    return { success: false, affected: 0, error: err.message || "Bulk operation failed" };
  }
}
