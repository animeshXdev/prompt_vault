import React from "react";
import prisma from "@/lib/db";
import { Pin } from "lucide-react";
import { PromptList } from "@/components/prompts/prompt-list";

export default async function PinnedPage() {
  const prompts = await prisma.prompt.findMany({
    where: {
      isPinned: true,
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
        <Pin className="w-5 h-5 text-indigo-500 fill-indigo-500" />
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Pinned Prompts
          </h1>
          <p className="text-xs text-zinc-500">
            High-priority pinned prompts kept accessible at the top of your workspace.
          </p>
        </div>
      </div>

      <PromptList prompts={prompts as any} />
    </div>
  );
}
