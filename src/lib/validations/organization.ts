import { z } from "zod";

export const folderSchema = z.object({
  name: z.string().trim().min(1, "Folder name is required").max(100),
  description: z.string().trim().max(500).optional().nullable(),
  color: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Invalid hex color").optional().nullable(),
  icon: z.string().optional().nullable(),
  parentId: z.string().optional().nullable(),
  workspaceId: z.string().optional().nullable(),
});

export type FolderInput = z.infer<typeof folderSchema>;

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Category name is required").max(100),
  description: z.string().trim().max(500).optional().nullable(),
  color: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Invalid hex color").optional().nullable(),
  icon: z.string().optional().nullable(),
});

export type CategoryInput = z.infer<typeof categorySchema>;

export const tagSchema = z.object({
  name: z.string().trim().min(1, "Tag name is required").max(50),
  color: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Invalid hex color").optional().nullable(),
});

export type TagInput = z.infer<typeof tagSchema>;

export const workspaceSchema = z.object({
  name: z.string().trim().min(1, "Workspace name is required").max(100),
  description: z.string().trim().max(1000).optional().nullable(),
  projectType: z.string().trim().optional().nullable(),
  technologyStack: z.string().trim().optional().nullable(),
  customInstructions: z.string().optional().nullable(),
  masterPrompt: z.string().optional().nullable(),
});

export type WorkspaceInput = z.infer<typeof workspaceSchema>;
