import fs from "node:fs/promises";
import path from "node:path";
import JSZip from "jszip";
import prisma from "@/lib/db";
import { getUploadDirectory, readAttachmentBuffer } from "@/lib/storage/attachments";
import { logActivity } from "@/lib/activity";

export interface BackupManifest {
  version: string;
  exportedAt: string;
  appName: string;
  counts: {
    prompts: number;
    versions: number;
    folders: number;
    categories: number;
    tags: number;
    workspaces: number;
    templates: number;
    masterPrompts: number;
    reusableRules: number;
    compositions: number;
    attachments: number;
  };
}

export async function createFullVaultBackup(): Promise<{ zipBuffer: Buffer; manifest: BackupManifest }> {
  const [
    prompts,
    versions,
    folders,
    categories,
    tags,
    promptTags,
    workspaces,
    workspaceSettings,
    templates,
    variables,
    presets,
    masterPrompts,
    reusableRules,
    compositions,
    blocks,
    attachments,
  ] = await Promise.all([
    prisma.prompt.findMany(),
    prisma.promptVersion.findMany(),
    prisma.folder.findMany(),
    prisma.category.findMany(),
    prisma.tag.findMany(),
    prisma.promptTag.findMany(),
    prisma.workspace.findMany(),
    prisma.workspaceSettings.findMany(),
    prisma.promptTemplate.findMany(),
    prisma.templateVariable.findMany(),
    prisma.templatePreset.findMany(),
    prisma.masterPrompt.findMany(),
    prisma.reusableRule.findMany(),
    prisma.promptComposition.findMany(),
    prisma.compositionBlock.findMany(),
    prisma.attachment.findMany(),
  ]);

  const manifest: BackupManifest = {
    version: "1.0.0",
    exportedAt: new Date().toISOString(),
    appName: "PromptVault",
    counts: {
      prompts: prompts.length,
      versions: versions.length,
      folders: folders.length,
      categories: categories.length,
      tags: tags.length,
      workspaces: workspaces.length,
      templates: templates.length,
      masterPrompts: masterPrompts.length,
      reusableRules: reusableRules.length,
      compositions: compositions.length,
      attachments: attachments.length,
    },
  };

  const zip = new JSZip();
  zip.file("manifest.json", JSON.stringify(manifest, null, 2));
  zip.file("prompts.json", JSON.stringify(prompts, null, 2));
  zip.file("versions.json", JSON.stringify(versions, null, 2));
  zip.file("folders.json", JSON.stringify(folders, null, 2));
  zip.file("categories.json", JSON.stringify(categories, null, 2));
  zip.file("tags.json", JSON.stringify(tags, null, 2));
  zip.file("promptTags.json", JSON.stringify(promptTags, null, 2));
  zip.file("workspaces.json", JSON.stringify(workspaces, null, 2));
  zip.file("workspaceSettings.json", JSON.stringify(workspaceSettings, null, 2));
  zip.file("templates.json", JSON.stringify(templates, null, 2));
  zip.file("templateVariables.json", JSON.stringify(variables, null, 2));
  zip.file("templatePresets.json", JSON.stringify(presets, null, 2));
  zip.file("masterPrompts.json", JSON.stringify(masterPrompts, null, 2));
  zip.file("reusableRules.json", JSON.stringify(reusableRules, null, 2));
  zip.file("compositions.json", JSON.stringify(compositions, null, 2));
  zip.file("compositionBlocks.json", JSON.stringify(blocks, null, 2));
  zip.file("attachments.json", JSON.stringify(attachments, null, 2));

  // Bundle attachment files if present on disk
  const attachmentsFolder = zip.folder("attachments");
  for (const att of attachments) {
    try {
      const buffer = await readAttachmentBuffer(att.storagePath);
      attachmentsFolder?.file(att.filename, buffer);
    } catch {
      // File missing on disk, continue
    }
  }

  const zipBuffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  await logActivity({ action: "backup_created", entityType: "system", details: { counts: manifest.counts } });

  return { zipBuffer, manifest };
}

export async function validateBackupArchive(zipBuffer: Buffer): Promise<{ valid: boolean; manifest?: BackupManifest; error?: string }> {
  try {
    const zip = await JSZip.loadAsync(zipBuffer);
    const manifestFile = zip.file("manifest.json");
    if (!manifestFile) {
      return { valid: false, error: "Invalid backup: manifest.json is missing" };
    }
    const manifestText = await manifestFile.async("string");
    const manifest = JSON.parse(manifestText) as BackupManifest;
    if (!manifest.counts || manifest.appName !== "PromptVault") {
      return { valid: false, error: "Invalid or unsupported PromptVault backup archive" };
    }
    return { valid: true, manifest };
  } catch (err: any) {
    return { valid: false, error: err.message || "Failed to parse backup ZIP file" };
  }
}

export async function restoreBackupArchive(zipBuffer: Buffer): Promise<{ success: boolean; error?: string }> {
  const check = await validateBackupArchive(zipBuffer);
  if (!check.valid || !check.manifest) {
    return { success: false, error: check.error };
  }

  const zip = await JSZip.loadAsync(zipBuffer);

  async function getJson<T>(filename: string): Promise<T[]> {
    const file = zip.file(filename);
    if (!file) return [];
    const text = await file.async("string");
    return JSON.parse(text);
  }

  const categories = await getJson<any>("categories.json");
  const tags = await getJson<any>("tags.json");
  const workspaces = await getJson<any>("workspaces.json");
  const workspaceSettings = await getJson<any>("workspaceSettings.json");
  const folders = await getJson<any>("folders.json");
  const prompts = await getJson<any>("prompts.json");
  const versions = await getJson<any>("versions.json");
  const promptTags = await getJson<any>("promptTags.json");
  const templates = await getJson<any>("templates.json");
  const variables = await getJson<any>("templateVariables.json");
  const presets = await getJson<any>("templatePresets.json");
  const masterPrompts = await getJson<any>("masterPrompts.json");
  const reusableRules = await getJson<any>("reusableRules.json");
  const compositions = await getJson<any>("compositions.json");
  const blocks = await getJson<any>("compositionBlocks.json");
  const attachments = await getJson<any>("attachments.json");

  // Restore in dependency order using upsert to handle conflicts safely
  for (const cat of categories) {
    await prisma.category.upsert({
      where: { id: cat.id },
      create: { id: cat.id, name: cat.name, description: cat.description, color: cat.color, icon: cat.icon },
      update: { name: cat.name, description: cat.description, color: cat.color, icon: cat.icon },
    });
  }

  for (const tag of tags) {
    await prisma.tag.upsert({
      where: { id: tag.id },
      create: { id: tag.id, name: tag.name, color: tag.color },
      update: { name: tag.name, color: tag.color },
    });
  }

  for (const ws of workspaces) {
    await prisma.workspace.upsert({
      where: { id: ws.id },
      create: {
        id: ws.id,
        name: ws.name,
        slug: ws.slug,
        description: ws.description,
        projectType: ws.projectType,
        technologyStack: ws.technologyStack,
        customInstructions: ws.customInstructions,
        masterPrompt: ws.masterPrompt,
        isArchived: !!ws.isArchived,
      },
      update: {
        name: ws.name,
        description: ws.description,
        projectType: ws.projectType,
        technologyStack: ws.technologyStack,
        customInstructions: ws.customInstructions,
        masterPrompt: ws.masterPrompt,
      },
    });
  }

  for (const f of folders) {
    await prisma.folder.upsert({
      where: { id: f.id },
      create: { id: f.id, name: f.name, description: f.description, color: f.color, icon: f.icon, parentId: f.parentId, workspaceId: f.workspaceId },
      update: { name: f.name, description: f.description, color: f.color, icon: f.icon, parentId: f.parentId, workspaceId: f.workspaceId },
    });
  }

  for (const p of prompts) {
    await prisma.prompt.upsert({
      where: { id: p.id },
      create: {
        id: p.id,
        title: p.title,
        description: p.description,
        content: p.content,
        notes: p.notes,
        isFavorite: !!p.isFavorite,
        isPinned: !!p.isPinned,
        isArchived: !!p.isArchived,
        isDeleted: !!p.isDeleted,
        status: p.status || "active",
        copyCount: p.copyCount || 0,
        targetPlatform: p.targetPlatform,
        targetModel: p.targetModel,
        estimatedTokens: p.estimatedTokens || 0,
        folderId: p.folderId,
        categoryId: p.categoryId,
        workspaceId: p.workspaceId,
      },
      update: {
        title: p.title,
        description: p.description,
        content: p.content,
        notes: p.notes,
        status: p.status,
      },
    });
  }

  for (const v of versions) {
    await prisma.promptVersion.upsert({
      where: { id: v.id },
      create: {
        id: v.id,
        promptId: v.promptId,
        versionNumber: v.versionNumber,
        title: v.title,
        content: v.content,
        notes: v.notes,
        changeNotes: v.changeNotes,
        isStable: !!v.isStable,
      },
      update: { content: v.content },
    });
  }

  for (const pt of promptTags) {
    await prisma.promptTag.upsert({
      where: { promptId_tagId: { promptId: pt.promptId, tagId: pt.tagId } },
      create: { id: pt.id, promptId: pt.promptId, tagId: pt.tagId },
      update: {},
    });
  }

  for (const t of templates) {
    await prisma.promptTemplate.upsert({
      where: { id: t.id },
      create: {
        id: t.id,
        title: t.title,
        description: t.description,
        templateContent: t.templateContent,
        workspaceId: t.workspaceId,
        isArchived: !!t.isArchived,
      },
      update: {
        title: t.title,
        templateContent: t.templateContent,
      },
    });
  }

  for (const v of variables) {
    await prisma.templateVariable.upsert({
      where: { id: v.id },
      create: {
        id: v.id,
        templateId: v.templateId,
        name: v.name,
        label: v.label,
        description: v.description,
        fieldType: v.fieldType || "text",
        defaultValue: v.defaultValue,
        isRequired: !!v.isRequired,
        optionsJson: v.optionsJson,
        orderIndex: v.orderIndex || 0,
      },
      update: {
        label: v.label,
        defaultValue: v.defaultValue,
      },
    });
  }

  for (const mp of masterPrompts) {
    await prisma.masterPrompt.upsert({
      where: { id: mp.id },
      create: {
        id: mp.id,
        title: mp.title,
        description: mp.description,
        content: mp.content,
        isGlobal: !!mp.isGlobal,
        workspaceId: mp.workspaceId,
        isActive: !!mp.isActive,
      },
      update: { content: mp.content },
    });
  }

  for (const rr of reusableRules) {
    await prisma.reusableRule.upsert({
      where: { id: rr.id },
      create: {
        id: rr.id,
        title: rr.title,
        category: rr.category,
        content: rr.content,
        priority: rr.priority || 0,
        isEnabled: !!rr.isEnabled,
        isGlobal: !!rr.isGlobal,
        workspaceId: rr.workspaceId,
      },
      update: { content: rr.content },
    });
  }

  for (const comp of compositions) {
    await prisma.promptComposition.upsert({
      where: { id: comp.id },
      create: {
        id: comp.id,
        title: comp.title,
        description: comp.description,
        workspaceId: comp.workspaceId,
        cachedCombinedText: comp.cachedCombinedText,
      },
      update: { title: comp.title },
    });
  }

  for (const b of blocks) {
    await prisma.compositionBlock.upsert({
      where: { id: b.id },
      create: {
        id: b.id,
        compositionId: b.compositionId,
        blockType: b.blockType,
        referenceId: b.referenceId,
        title: b.title,
        content: b.content,
        orderIndex: b.orderIndex || 0,
        isEnabled: !!b.isEnabled,
      },
      update: { content: b.content },
    });
  }

  // Restore attachments
  const uploadDir = getUploadDirectory();
  await fs.mkdir(uploadDir, { recursive: true });

  for (const att of attachments) {
    const fileInZip = zip.file(`attachments/${att.filename}`);
    const destPath = path.resolve(uploadDir, att.filename);

    if (fileInZip) {
      const fileData = await fileInZip.async("nodebuffer");
      await fs.writeFile(destPath, fileData);
    }

    await prisma.attachment.upsert({
      where: { id: att.id },
      create: {
        id: att.id,
        filename: att.filename,
        originalName: att.originalName,
        mimeType: att.mimeType,
        fileSize: att.fileSize,
        storagePath: destPath,
        promptId: att.promptId,
        workspaceId: att.workspaceId,
      },
      update: { storagePath: destPath },
    });
  }

  await logActivity({ action: "backup_restored", entityType: "system", details: { manifest: check.manifest } });

  return { success: true };
}
