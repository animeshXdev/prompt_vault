"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { categorySchema, type CategoryInput } from "@/lib/validations/organization";
import { logActivity } from "@/lib/activity";

export async function createCategoryAction(input: CategoryInput): Promise<{ success: boolean; categoryId?: string; error?: string }> {
  await requireAuth();

  const val = categorySchema.safeParse(input);
  if (!val.success) {
    return { success: false, error: val.error.issues[0]?.message };
  }

  try {
    const category = await prisma.category.create({
      data: {
        name: val.data.name,
        description: val.data.description || null,
        color: val.data.color || "#3b82f6",
        icon: val.data.icon || "Tag",
      },
    });

    await logActivity({ action: "category_created", entityType: "category", entityId: category.id, details: { name: category.name } });

    revalidatePath("/categories");
    return { success: true, categoryId: category.id };
  } catch (err: any) {
    if (err.code === "P2002") {
      return { success: false, error: "A category with this name already exists" };
    }
    return { success: false, error: err.message || "Failed to create category" };
  }
}

export async function updateCategoryAction(id: string, input: CategoryInput): Promise<{ success: boolean; error?: string }> {
  await requireAuth();

  const val = categorySchema.safeParse(input);
  if (!val.success) {
    return { success: false, error: val.error.issues[0]?.message };
  }

  try {
    await prisma.category.update({
      where: { id },
      data: {
        name: val.data.name,
        description: val.data.description || null,
        color: val.data.color || null,
        icon: val.data.icon || null,
      },
    });

    revalidatePath("/categories");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update category" };
  }
}

export async function deleteCategoryAction(
  id: string,
  reassignToCategoryId?: string | null
): Promise<{ success: boolean; error?: string }> {
  await requireAuth();

  try {
    await prisma.$transaction(async (tx) => {
      // Reassign all prompts from this category
      await tx.prompt.updateMany({
        where: { categoryId: id },
        data: { categoryId: reassignToCategoryId || null },
      });

      await tx.category.delete({ where: { id } });
    });

    await logActivity({ action: "category_deleted", entityType: "category", entityId: id });

    revalidatePath("/categories");
    revalidatePath("/prompts");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete category" };
  }
}
