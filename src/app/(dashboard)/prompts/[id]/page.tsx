import React from "react";
import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import { PromptDetailTabs } from "./prompt-detail-tabs";

export default async function PromptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [prompt, folders, categories, workspaces, allTags] = await Promise.all([
    prisma.prompt.findUnique({
      where: { id },
      include: {
        folder: true,
        category: true,
        workspace: true,
        promptTags: { include: { tag: true } },
        versions: { orderBy: { versionNumber: "desc" } },
        attachments: { orderBy: { createdAt: "desc" } },
        aiTestResults: { orderBy: { createdAt: "desc" }, take: 10 },
      },
    }),
    prisma.folder.findMany({ select: { id: true, name: true } }),
    prisma.category.findMany({ select: { id: true, name: true } }),
    prisma.workspace.findMany({ where: { isArchived: false }, select: { id: true, name: true } }),
    prisma.tag.findMany({ select: { id: true, name: true } }),
  ]);

  if (!prompt) {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <PromptDetailTabs
        prompt={prompt}
        folders={folders}
        categories={categories}
        workspaces={workspaces}
        allTags={allTags}
        versions={prompt.versions as any}
        attachments={prompt.attachments as any}
        aiHistory={prompt.aiTestResults as any}
      />
    </div>
  );
}
