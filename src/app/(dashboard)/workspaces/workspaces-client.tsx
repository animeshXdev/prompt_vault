"use client";

import React, { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Plus,
  Copy,
  Archive,
  Trash2,
  FileText,
  Folder,
  Layers,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  duplicateWorkspaceAction,
  toggleArchiveWorkspaceAction,
  deleteWorkspaceAction,
} from "@/features/workspaces/actions";

interface WorkspaceRecord {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  projectType?: string | null;
  technologyStack?: string | null;
  isArchived: boolean;
  _count: {
    prompts: number;
    folders: number;
    templates: number;
  };
}

export function WorkspacesClient({ workspaces }: { workspaces: WorkspaceRecord[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDuplicate = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      const res = await duplicateWorkspaceAction(id);
      if (res.success) {
        toast.success("Workspace duplicated successfully");
        router.refresh();
      } else {
        toast.error(res.error || "Failed to duplicate workspace");
      }
    });
  };

  const handleToggleArchive = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      const res = await toggleArchiveWorkspaceAction(id);
      toast.success(res.isArchived ? "Workspace archived" : "Workspace restored");
      router.refresh();
    });
  };

  const handleDelete = (id: string, name: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete workspace "${name}"?`)) return;

    startTransition(async () => {
      const res = await deleteWorkspaceAction(id);
      if (res.success) {
        toast.success("Workspace deleted");
        router.refresh();
      } else {
        toast.error(res.error || "Failed to delete workspace");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Project Workspaces
          </h1>
          <p className="text-xs text-zinc-500">
            Isolated environments with tailored instructions, technology stacks, prompts, and standards.
          </p>
        </div>
        <Button asChild size="sm" className="gap-1.5 shadow-xs">
          <Link href="/workspaces/new">
            <Plus className="w-3.5 h-3.5" />
            <span>New Workspace</span>
          </Link>
        </Button>
      </div>

      {workspaces.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg space-y-3">
          <Briefcase className="w-8 h-8 text-zinc-400 mx-auto" />
          <h3 className="text-xs font-semibold">No workspaces created yet</h3>
          <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
            Workspaces organize prompts around specific technology stacks, clients, or domain standards (e.g. Next.js Architecture, API Development).
          </p>
          <Button asChild size="sm" className="mt-2">
            <Link href="/workspaces/new">Create First Workspace</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {workspaces.map((ws) => (
            <div
              key={ws.id}
              className={`p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-2xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors flex flex-col justify-between ${
                ws.isArchived ? "opacity-60" : ""
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 truncate">
                    <div className="p-1.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <Link
                      href={`/workspaces/${ws.id}`}
                      className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline truncate"
                    >
                      {ws.name}
                    </Link>
                  </div>
                  {ws.projectType && (
                    <Badge variant="outline" className="text-[10px] py-0 shrink-0">
                      {ws.projectType}
                    </Badge>
                  )}
                </div>

                {ws.description && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
                    {ws.description}
                  </p>
                )}

                {ws.technologyStack && (
                  <div className="flex items-center gap-1 font-mono text-[10px] text-zinc-400 truncate">
                    <span>Stack:</span>
                    <span className="text-zinc-600 dark:text-zinc-300 truncate">{ws.technologyStack}</span>
                  </div>
                )}

                {/* Counts Summary */}
                <div className="flex items-center gap-3 pt-2 text-[11px] text-zinc-500 font-mono">
                  <span className="flex items-center gap-1">
                    <FileText className="w-3 h-3 text-zinc-400" />
                    {ws._count.prompts} prompts
                  </span>
                  <span className="flex items-center gap-1">
                    <Folder className="w-3 h-3 text-zinc-400" />
                    {ws._count.folders} folders
                  </span>
                  <span className="flex items-center gap-1">
                    <Layers className="w-3 h-3 text-zinc-400" />
                    {ws._count.templates} templates
                  </span>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-3 mt-3 border-t border-zinc-100 dark:border-zinc-800/60 text-xs">
                <Button asChild variant="link" size="sm" className="px-0 h-auto text-indigo-500 gap-1">
                  <Link href={`/workspaces/${ws.id}`}>
                    <span>Enter Hub</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </Button>

                <div className="flex items-center gap-1">
                  <Button
                    size="iconSm"
                    variant="ghost"
                    onClick={(e) => handleDuplicate(ws.id, e)}
                    title="Duplicate Workspace"
                  >
                    <Copy className="w-3.5 h-3.5 text-zinc-400" />
                  </Button>
                  <Button
                    size="iconSm"
                    variant="ghost"
                    onClick={(e) => handleToggleArchive(ws.id, e)}
                    title={ws.isArchived ? "Unarchive" : "Archive"}
                  >
                    <Archive className="w-3.5 h-3.5 text-zinc-400" />
                  </Button>
                  <Button
                    size="iconSm"
                    variant="ghost"
                    onClick={(e) => handleDelete(ws.id, ws.name, e)}
                    title="Delete Workspace"
                    className="hover:text-red-500"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-zinc-400 hover:text-red-500" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
