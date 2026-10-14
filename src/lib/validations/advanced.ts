import { z } from "zod";

export const templateVariableSchema = z.object({
  name: z.string().trim().min(1, "Variable name is required").regex(/^[a-zA-Z0-9_]+$/, "Name must only contain letters, numbers, and underscores"),
  label: z.string().trim().min(1, "Label is required"),
  description: z.string().optional().nullable(),
  fieldType: z.enum(["text", "multiline", "dropdown"]).default("text"),
  defaultValue: z.string().optional().nullable(),
  isRequired: z.boolean().default(false),
  options: z.array(z.string()).optional(),
});

export const promptTemplateSchema = z.object({
  title: z.string().trim().min(1, "Template title is required").max(200),
  description: z.string().trim().max(1000).optional().nullable(),
  templateContent: z.string().min(1, "Template content is required"),
  workspaceId: z.string().optional().nullable(),
  variables: z.array(templateVariableSchema).default([]),
});

export type PromptTemplateInput = z.infer<typeof promptTemplateSchema>;

export const masterPromptSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().max(1000).optional().nullable(),
  content: z.string().min(1, "Content cannot be empty"),
  isGlobal: z.boolean().default(true),
  workspaceId: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export type MasterPromptInput = z.infer<typeof masterPromptSchema>;

export const reusableRuleSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  category: z.string().trim().min(1, "Category is required"),
  content: z.string().min(1, "Rule content cannot be empty"),
  priority: z.number().int().default(0),
  isEnabled: z.boolean().default(true),
  isGlobal: z.boolean().default(true),
  workspaceId: z.string().optional().nullable(),
});

export type ReusableRuleInput = z.infer<typeof reusableRuleSchema>;

export const compositionBlockSchema = z.object({
  id: z.string().optional(),
  blockType: z.enum(["global_master", "workspace_rule", "saved_prompt", "reusable_rule", "custom_text", "output_format"]),
  referenceId: z.string().optional().nullable(),
  title: z.string().min(1),
  content: z.string(),
  orderIndex: z.number().int().default(0),
  isEnabled: z.boolean().default(true),
});

export const promptCompositionSchema = z.object({
  title: z.string().trim().min(1, "Composition title is required").max(200),
  description: z.string().trim().max(1000).optional().nullable(),
  workspaceId: z.string().optional().nullable(),
  blocks: z.array(compositionBlockSchema).default([]),
});

export type PromptCompositionInput = z.infer<typeof promptCompositionSchema>;
