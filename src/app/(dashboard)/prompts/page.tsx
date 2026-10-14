import React from "react";
import Link from "next/link";
import prisma from "@/lib/db";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PromptList } from "@/components/prompts/prompt-list";
import { PromptFilters } from "@/components/prompts/prompt-filters";

export default async function PromptsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const query = await searchParams;
  const search = typeof query.search === "string" ? query.search.trim() : "";
  const folderId = typeof query.folderId === "string" ? query.folderId : undefined;
  const categoryId = typeof query.categoryId === "string" ? query.categoryId : undefined;
  const workspaceId = typeof query.workspaceId === "string" ? query.workspaceId : undefined;
  const sortBy = typeof query.sortBy === "string" ? query.sortBy : "newest";

  // Build Prisma where clause
  const where: any = {
    isDeleted: false,
    isArchived: false,
  };

  if (folderId) where.folderId = folderId;
  if (categoryId) where.categoryId = categoryId;
  if (workspaceId) where.workspaceId = workspaceId;

  if (search) {
    where.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
      { content: { contains: search } },
    ];
  }

  // Build Prisma orderBy
  let orderBy: any = { createdAt: "desc" };
  if (sortBy === "oldest") orderBy = { createdAt: "asc" };
  if (sortBy === "updated") orderBy = { updatedAt: "desc" };
  if (sortBy === "alphabetical") orderBy = { title: "asc" };
  if (sortBy === "copied") orderBy = { copyCount: "desc" };

  const [prompts, folders, categories, workspaces] = await Promise.all([
    prisma.prompt.findMany({
      where,
      orderBy,
      include: {
        folder: true,
        category: true,
        workspace: true,
        promptTags: { include: { tag: true } },
      },
    }),
    prisma.folder.findMany({ select: { id: true, name: true } }),
    prisma.category.findMany({ select: { id: true, name: true } }),
    prisma.workspace.findMany({ where: { isArchived: false }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            All Prompts
          </h1>
          <p className="text-xs text-zinc-500">
            Manage, filter, search, and organize your prompt catalog.
          </p>
        </div>
        <Button asChild size="sm" className="gap-1.5 shadow-xs">
          <Link href="/prompts/new">
            <Plus className="w-3.5 h-3.5" />
            <span>New Prompt</span>
          </Link>
        </Button>
      </div>

      <PromptFilters folders={folders} categories={categories} workspaces={workspaces} />
      <PromptList prompts={prompts as any} folders={folders} />
    </div>
  );
}
