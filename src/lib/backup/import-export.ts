import prisma from "@/lib/db";
import { logActivity } from "@/lib/activity";

export interface ParsedImportItem {
  title: string;
  description?: string;
  content: string;
  tags?: string[];
  category?: string;
  targetPlatform?: string;
  isDuplicate?: boolean;
}

export function parsePromptFromJson(jsonString: string): ParsedImportItem[] {
  try {
    const parsed = JSON.parse(jsonString);
    const items = Array.isArray(parsed) ? parsed : [parsed];
    return items.map((item, index) => {
      const title = item.title?.trim() || `Imported Prompt ${index + 1}`;
      const content = item.content || item.prompt || "";
      const description = item.description || "";
      const tags = Array.isArray(item.tags) ? item.tags : [];
      const category = item.category || undefined;
      const targetPlatform = item.targetPlatform || item.platform || undefined;
      return { title, description, content, tags, category, targetPlatform };
    }).filter((item) => item.content.trim().length > 0);
  } catch {
    throw new Error("Invalid JSON file format");
  }
}

export function parsePromptFromMarkdown(filename: string, mdString: string): ParsedImportItem[] {
  // If the markdown file has frontmatter, parse it; otherwise use file name as title
  const lines = mdString.split("\n");
  let title = filename.replace(/\.(md|txt)$/i, "");
  let content = mdString;
  let description = "";

  if (lines[0]?.trim().startsWith("# ")) {
    title = lines[0].replace(/^#\s+/, "").trim();
    content = lines.slice(1).join("\n").trim();
  }

  return [{ title, description, content }];
}

export async function detectDuplicates(items: ParsedImportItem[]): Promise<ParsedImportItem[]> {
  const existingPrompts = await prisma.prompt.findMany({
    select: { title: true, content: true },
  });

  const titles = new Set(existingPrompts.map((p) => p.title.toLowerCase()));

  return items.map((item) => {
    const isDuplicate = titles.has(item.title.toLowerCase());
    return { ...item, isDuplicate };
  });
}

export async function executeImport(
  items: ParsedImportItem[],
  options?: { folderId?: string; workspaceId?: string; categoryId?: string }
): Promise<{ importedCount: number; errors: string[] }> {
  let importedCount = 0;
  const errors: string[] = [];

  for (const item of items) {
    try {
      if (!item.content.trim()) continue;

      const created = await prisma.prompt.create({
        data: {
          title: item.title,
          description: item.description || null,
          content: item.content,
          folderId: options?.folderId || null,
          workspaceId: options?.workspaceId || null,
          categoryId: options?.categoryId || null,
          targetPlatform: item.targetPlatform || null,
          versions: {
            create: {
              versionNumber: 1,
              title: item.title,
              content: item.content,
              changeNotes: "Initial import",
            },
          },
        },
      });

      // Handle tags
      if (item.tags && item.tags.length > 0) {
        for (const tagName of item.tags) {
          const trimmed = tagName.trim();
          if (!trimmed) continue;
          let tag = await prisma.tag.findUnique({ where: { name: trimmed } });
          if (!tag) {
            tag = await prisma.tag.create({ data: { name: trimmed } });
          }
          await prisma.promptTag.create({
            data: { promptId: created.id, tagId: tag.id },
          }).catch(() => {});
        }
      }

      importedCount++;
    } catch (err: any) {
      errors.push(`Failed to import "${item.title}": ${err.message}`);
    }
  }

  await logActivity({
    action: "prompts_imported",
    entityType: "prompt",
    details: { importedCount, errorsCount: errors.length },
  });

  return { importedCount, errors };
}
