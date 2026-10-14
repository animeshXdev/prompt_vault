import React from "react";
import prisma from "@/lib/db";
import { PromptForm } from "@/components/prompts/prompt-form";

export default async function NewPromptPage() {
  const [folders, categories, workspaces, allTags] = await Promise.all([
    prisma.folder.findMany({ select: { id: true, name: true } }),
    prisma.category.findMany({ select: { id: true, name: true } }),
    prisma.workspace.findMany({ where: { isArchived: false }, select: { id: true, name: true } }),
    prisma.tag.findMany({ select: { id: true, name: true } }),
  ]);

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Create New Prompt
          </h1>
          <p className="text-xs text-zinc-500">
            Compose and catalog an AI prompt with syntax highlighting, token estimation, and version tracking.
          </p>
        </div>
      </div>

      <PromptForm
        folders={folders}
        categories={categories}
        workspaces={workspaces}
        allTags={allTags}
      />
    </div>
  );
}
