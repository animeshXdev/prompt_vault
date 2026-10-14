import React from "react";
import prisma from "@/lib/db";
import { Archive } from "lucide-react";
import { PromptList } from "@/components/prompts/prompt-list";

export default async function ArchivePage() {
  const prompts = await prisma.prompt.findMany({
    where: {
      isArchived: true,
      isDeleted: false,
    },
    orderBy: { updatedAt: "desc" },
    include: {
      folder: true,
      category: true,
      workspace: true,
      promptTags: { include: { tag: true } },
    },
  });

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      <div className="flex items-center gap-2">
        <Archive className="w-5 h-5 text-zinc-500" />
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Archived Prompts
          </h1>
          <p className="text-xs text-zinc-500">
            Completed, retired, or historical prompts preserved for reference.
          </p>
        </div>
      </div>

      <PromptList prompts={prompts as any} isArchiveView={true} />
    </div>
  );
}
