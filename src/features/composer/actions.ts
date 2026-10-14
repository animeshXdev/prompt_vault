"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { promptCompositionSchema, type PromptCompositionInput } from "@/lib/validations/advanced";
import { logActivity } from "@/lib/activity";

export async function saveCompositionAction(input: PromptCompositionInput, existingId?: string): Promise<{ success: boolean; compositionId?: string; error?: string }> {
  await requireAuth();

  const val = promptCompositionSchema.safeParse(input);
  if (!val.success) {
    return { success: false, error: val.error.issues[0]?.message };
  }

  const { title, description, workspaceId, blocks } = val.data;

  // Combine enabled block contents
  const combinedText = blocks
    .filter((b) => b.isEnabled)
    .map((b) => b.content)
    .join("\n\n---\n\n");

  try {
    let compositionId = existingId;

    if (existingId) {
      await prisma.$transaction(async (tx) => {
        await tx.promptComposition.update({
          where: { id: existingId },
          data: {
            title,
            description: description || null,
            workspaceId: workspaceId || null,
            cachedCombinedText: combinedText,
          },
        });

        await tx.compositionBlock.deleteMany({ where: { compositionId: existingId } });

        if (blocks.length > 0) {
          await tx.compositionBlock.createMany({
            data: blocks.map((b, idx) => ({
              compositionId: existingId,
              blockType: b.blockType,
              referenceId: b.referenceId || null,
              title: b.title,
              content: b.content,
              orderIndex: idx,
              isEnabled: b.isEnabled,
            })),
          });
        }
      });
    } else {
      const created = await prisma.$transaction(async (tx) => {
        const comp = await tx.promptComposition.create({
          data: {
            title,
            description: description || null,
            workspaceId: workspaceId || null,
            cachedCombinedText: combinedText,
          },
        });

        if (blocks.length > 0) {
          await tx.compositionBlock.createMany({
            data: blocks.map((b, idx) => ({
              compositionId: comp.id,
              blockType: b.blockType,
              referenceId: b.referenceId || null,
              title: b.title,
              content: b.content,
              orderIndex: idx,
              isEnabled: b.isEnabled,
            })),
          });
        }

        return comp;
      });

      compositionId = created.id;
    }

    await logActivity({ action: "composition_saved", entityType: "composition", entityId: compositionId, details: { title } });

    revalidatePath("/composer");
    return { success: true, compositionId };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to save composition" };
  }
}

export async function deleteCompositionAction(id: string): Promise<{ success: boolean; error?: string }> {
  await requireAuth();

  try {
    await prisma.promptComposition.delete({ where: { id } });
    revalidatePath("/composer");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete composition" };
  }
}
