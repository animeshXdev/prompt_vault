"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { saveUploadedFile, deleteAttachmentFile } from "@/lib/storage/attachments";
import { logActivity } from "@/lib/activity";

export async function uploadAttachmentAction(
  formData: FormData
): Promise<{ success: boolean; attachment?: any; error?: string }> {
  await requireAuth();

  const file = formData.get("file") as File | null;
  const promptId = (formData.get("promptId") as string) || null;
  const workspaceId = (formData.get("workspaceId") as string) || null;

  if (!file) {
    return { success: false, error: "No file provided" };
  }

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const saved = await saveUploadedFile(buffer, file.name, file.type || "application/octet-stream");

    const attachment = await prisma.attachment.create({
      data: {
        filename: saved.filename,
        originalName: saved.originalName,
        mimeType: saved.mimeType,
        fileSize: saved.fileSize,
        storagePath: saved.storagePath,
        promptId,
        workspaceId,
      },
    });

    await logActivity({
      action: "attachment_uploaded",
      entityType: "attachment",
      entityId: attachment.id,
      details: { name: attachment.originalName, size: attachment.fileSize },
    });

    revalidatePath("/files");
    if (promptId) revalidatePath(`/prompts/${promptId}`);
    if (workspaceId) revalidatePath(`/workspaces/${workspaceId}`);

    return { success: true, attachment };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to upload file" };
  }
}

export async function deleteAttachmentAction(id: string): Promise<{ success: boolean; error?: string }> {
  await requireAuth();

  try {
    const att = await prisma.attachment.findUnique({ where: { id } });
    if (!att) return { success: false, error: "Attachment not found" };

    // Delete from disk
    await deleteAttachmentFile(att.storagePath);
    // Delete from DB
    await prisma.attachment.delete({ where: { id } });

    await logActivity({ action: "attachment_deleted", entityType: "attachment", entityId: id });

    revalidatePath("/files");
    if (att.promptId) revalidatePath(`/prompts/${att.promptId}`);
    if (att.workspaceId) revalidatePath(`/workspaces/${att.workspaceId}`);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete attachment" };
  }
}

export async function renameAttachmentAction(id: string, newName: string): Promise<{ success: boolean; error?: string }> {
  await requireAuth();

  if (!newName.trim()) {
    return { success: false, error: "New filename cannot be empty" };
  }

  try {
    await prisma.attachment.update({
      where: { id },
      data: { originalName: newName.trim() },
    });

    revalidatePath("/files");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to rename attachment" };
  }
}
