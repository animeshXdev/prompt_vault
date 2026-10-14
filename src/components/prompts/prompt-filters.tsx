"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Filter, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";

interface PromptFiltersProps {
  folders?: { id: string; name: string }[];
  categories?: { id: string; name: string }[];
  workspaces?: { id: string; name: string }[];
}

export function PromptFilters({ folders = [], categories = [], workspaces = [] }: PromptFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentSearch = searchParams.get("search") || "";
  const currentFolder = searchParams.get("folderId") || "";
  const currentCategory = searchParams.get("categoryId") || "";
  const currentWorkspace = searchParams.get("workspaceId") || "";
  const currentSort = searchParams.get("sortBy") || "newest";

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-zinc-400" />
        <Input
          defaultValue={currentSearch}
          placeholder="Filter prompts by title, description, or content..."
          className="pl-8 h-8 text-xs bg-zinc-50 dark:bg-zinc-950"
          onChange={(e) => updateParam("search", e.target.value)}
        />
      </div>

      {/* Folder Filter */}
      {folders.length > 0 && (
        <select
          value={currentFolder}
          onChange={(e) => updateParam("folderId", e.target.value)}
          className="h-8 px-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs text-zinc-900 dark:text-zinc-100"
        >
          <option value="">All Folders</option>
          {folders.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      )}

      {/* Category Filter */}
      {categories.length > 0 && (
        <select
          value={currentCategory}
          onChange={(e) => updateParam("categoryId", e.target.value)}
          className="h-8 px-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs text-zinc-900 dark:text-zinc-100"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      )}

      {/* Workspace Filter */}
      {workspaces.length > 0 && (
        <select
          value={currentWorkspace}
          onChange={(e) => updateParam("workspaceId", e.target.value)}
          className="h-8 px-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs text-zinc-900 dark:text-zinc-100"
        >
          <option value="">All Workspaces</option>
          {workspaces.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
      )}

      {/* Sort By */}
      <select
        value={currentSort}
        onChange={(e) => updateParam("sortBy", e.target.value)}
        className="h-8 px-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs text-zinc-900 dark:text-zinc-100"
      >
        <option value="newest">Sort: Newest First</option>
        <option value="oldest">Sort: Oldest First</option>
        <option value="updated">Sort: Recently Modified</option>
        <option value="alphabetical">Sort: Alphabetical (A-Z)</option>
        <option value="copied">Sort: Most Copied</option>
      </select>
    </div>
  );
}
