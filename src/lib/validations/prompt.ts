import { z } from "zod";

export const promptSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200, "Title cannot exceed 200 characters"),
  description: z.string().trim().max(1000, "Description cannot exceed 1000 characters").optional().nullable(),
  content: z.string().min(1, "Prompt content cannot be empty"),
  notes: z.string().optional().nullable(),
  folderId: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  workspaceId: z.string().optional().nullable(),
  tags: z.array(z.string().trim()).default([]),
  targetPlatform: z.string().optional().nullable(),
  targetModel: z.string().optional().nullable(),
  isFavorite: z.boolean().default(false),
  isPinned: z.boolean().default(false),
  isArchived: z.boolean().default(false),
  status: z.enum(["draft", "active", "archived"]).default("active"),
  changeNotes: z.string().optional().nullable(),
});

export type PromptInput = z.infer<typeof promptSchema>;

export const promptFilterSchema = z.object({
  search: z.string().optional(),
  folderId: z.string().optional(),
  categoryId: z.string().optional(),
  workspaceId: z.string().optional(),
  tag: z.string().optional(),
  isFavorite: z.boolean().optional(),
  isPinned: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  isDeleted: z.boolean().optional(),
  status: z.string().optional(),
  targetPlatform: z.string().optional(),
  sortBy: z.enum(["newest", "oldest", "updated", "alphabetical", "copied"]).default("newest"),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export type PromptFilter = z.infer<typeof promptFilterSchema>;
