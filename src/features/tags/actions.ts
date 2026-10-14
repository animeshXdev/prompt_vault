"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { tagSchema, type TagInput } from "@/lib/validations/organization";
import { logActivity } from "@/lib/activity";

export async function createTagAction(input: TagInput): Promise<{ success: boolean; tagId?: string; error?: string }> {
  await requireAuth();

  const val = tagSchema.safeParse(input);
  if (!val.success) {
    return { success: false, error: val.error.issues[0]?.message };
  }

  try {
    const tag = await prisma.tag.create({
      data: {
        name: val.data.name.toLowerCase().trim(),
        color: val.data.color || "#8b5cf6",
      },
    });

    await logActivity({ action: "tag_created", entityType: "tag", entityId: tag.id, details: { name: tag.name } });

    revalidatePath("/tags");
    return { success: true, tagId: tag.id };
  } catch (err: any) {
    if (err.code === "P2002") {
      return { success: false, error: "A tag with this name already exists" };
    }
    return { success: false, error: err.message || "Failed to create tag" };
  }
}

export async function deleteTagAction(id: string): Promise<{ success: boolean; error?: string }> {
  await requireAuth();

  try {
    await prisma.tag.delete({ where: { id } });
    await logActivity({ action: "tag_deleted", entityType: "tag", entityId: id });

    revalidatePath("/tags");
    revalidatePath("/prompts");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete tag" };
  }
}
