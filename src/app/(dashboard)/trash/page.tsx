import React from "react";
import prisma from "@/lib/db";
import { Trash2 } from "lucide-react";
import { PromptList } from "@/components/prompts/prompt-list";

export default async function TrashPage() {
  const prompts = await prisma.prompt.findMany({
    where: {
      isDeleted: true,
    },
    orderBy: { deletedAt: "desc" },
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
        <Trash2 className="w-5 h-5 text-red-500" />
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Trash
          </h1>
          <p className="text-xs text-zinc-500">
            Deleted prompts can be restored or permanently removed from database storage.
          </p>
        </div>
      </div>

      <PromptList prompts={prompts as any} isTrashView={true} />
    </div>
  );
}
