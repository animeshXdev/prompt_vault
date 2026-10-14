"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Star,
  Pin,
  Copy,
  Check,
  MoreVertical,
  Trash2,
  Archive,
  RotateCcw,
  FolderInput,
  Folder,
  Layers,
  Sparkles,
  ExternalLink,
  History,
  FileText,
  Search,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  toggleFavoriteAction,
  togglePinAction,
  toggleArchiveAction,
  deletePromptAction,
  restorePromptAction,
  duplicatePromptAction,
  recordCopyAction,
  bulkUpdatePromptsAction,
} from "@/features/prompts/actions";
import { formatDateShort } from "@/lib/utils";

export interface PromptItem {
  id: string;
  title: string;
  description?: string | null;
  content: string;
  isFavorite: boolean;
  isPinned: boolean;
  isArchived: boolean;
  isDeleted: boolean;
  status: string;
  copyCount: number;
  targetPlatform?: string | null;
  estimatedTokens: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  folder?: { id: string; name: string; color?: string | null } | null;
  category?: { id: string; name: string; color?: string | null } | null;
  workspace?: { id: string; name: string } | null;
  promptTags?: { tag: { id: string; name: string; color?: string | null } }[];
  _count?: { versions: number; attachments: number };
}

interface PromptListProps {
  prompts: PromptItem[];
  folders?: { id: string; name: string }[];
  isTrashView?: boolean;
  isArchiveView?: boolean;
}

export function PromptList({ prompts, folders = [], isTrashView = false, isArchiveView = false }: PromptListProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [permDeleteId, setPermDeleteId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(prompts.map((p) => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleCopy = async (id: string, content: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
      toast.success("Prompt copied to clipboard");
      await recordCopyAction(id, "markdown");
      setTimeout(() => setCopiedId(null), 2000);
      router.refresh();
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleFavorite = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      const res = await toggleFavoriteAction(id);
      toast.success(res.isFavorite ? "Added to favorites" : "Removed from favorites");
    });
  };

  const handlePin = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      const res = await togglePinAction(id);
      toast.success(res.isPinned ? "Prompt pinned" : "Prompt unpinned");
    });
  };

  const handleDuplicate = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      const res = await duplicatePromptAction(id);
      if (res.success) {
        toast.success("Prompt duplicated successfully");
        router.refresh();
      }
    });
  };

  const handleSoftDelete = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      await deletePromptAction(id, false);
      toast.success("Prompt moved to trash");
      router.refresh();
    });
  };

  const handleRestore = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      await restorePromptAction(id);
      toast.success("Prompt restored from trash");
      router.refresh();
    });
  };

  const handlePermanentDelete = () => {
    if (!permDeleteId) return;
    startTransition(async () => {
      await deletePromptAction(permDeleteId, true);
      toast.success("Prompt permanently deleted");
      setPermDeleteId(null);
      router.refresh();
    });
  };

  const handleBulkAction = (action: "trash" | "archive" | "unarchive" | "restore" | "delete_permanent") => {
    startTransition(async () => {
      const res = await bulkUpdatePromptsAction(selectedIds, action);
      if (res.success) {
        toast.success(`Updated ${res.affected} prompts`);
        setSelectedIds([]);
        router.refresh();
      }
    });
  };

  if (prompts.length === 0) {
    return (
      <div className="border border-dashed border-zinc-300 dark:border-zinc-800 rounded-lg p-12 text-center flex flex-col items-center justify-center space-y-3">
        <FileText className="w-10 h-10 text-zinc-300 dark:text-zinc-700" />
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {isTrashView ? "Trash is empty" : isArchiveView ? "No archived prompts" : "No prompts found"}
          </h3>
          <p className="text-xs text-zinc-500 max-w-sm">
            {isTrashView
              ? "Items moved to trash will appear here before permanent deletion."
              : isArchiveView
              ? "Archived prompts will be kept safe and out of active workflows here."
              : "Create your first AI prompt to begin building your personal prompt library."}
          </p>
        </div>
        {!isTrashView && !isArchiveView && (
          <Button asChild size="sm" className="gap-1 mt-2">
            <Link href="/prompts/new">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Create Prompt</span>
            </Link>
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3 select-none">
      {/* Bulk Action Header Toolbar */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between p-2 px-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 rounded-lg text-xs animate-in fade-in">
          <span className="font-medium text-indigo-700 dark:text-indigo-300">
            {selectedIds.length} prompt{selectedIds.length > 1 ? "s" : ""} selected
          </span>
          <div className="flex items-center gap-2">
            {!isTrashView ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction("archive")}
                  disabled={isPending}
                >
                  <Archive className="w-3.5 h-3.5 mr-1" />
                  Archive
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleBulkAction("trash")}
                  disabled={isPending}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  Move to Trash
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction("restore")}
                  disabled={isPending}
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1 text-emerald-500" />
                  Restore
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleBulkAction("delete_permanent")}
                  disabled={isPending}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  Delete Permanently
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Prompts Table */}
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden bg-white dark:bg-zinc-900/60 shadow-2xs">
        <div className="divide-y divide-zinc-200/70 dark:divide-zinc-800/70">
          {/* Header Row */}
          <div className="flex items-center px-3 py-2 bg-zinc-50/80 dark:bg-zinc-950/80 text-[11px] font-semibold text-zinc-500">
            <div className="w-7 flex items-center justify-center">
              <Checkbox
                checked={selectedIds.length === prompts.length && prompts.length > 0}
                onCheckedChange={handleSelectAll}
              />
            </div>
            <div className="flex-1 px-2">Prompt Title & Tags</div>
            <div className="hidden sm:block w-36 px-2">Folder / Workspace</div>
            <div className="hidden md:block w-24 px-2 text-right">Tokens / Copies</div>
            <div className="w-24 px-2 text-right">Updated</div>
            <div className="w-24 text-right pr-1">Actions</div>
          </div>

          {/* Prompt Rows */}
          {prompts.map((p) => {
            const isSelected = selectedIds.includes(p.id);

            return (
              <div
                key={p.id}
                className={`flex items-center px-3 py-2.5 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/40 group ${
                  isSelected ? "bg-indigo-50/40 dark:bg-indigo-950/20" : ""
                }`}
              >
                {/* Select Checkbox */}
                <div className="w-7 flex items-center justify-center shrink-0">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleToggleSelect(p.id)}
                  />
                </div>

                {/* Title & Preview & Tags */}
                <div className="flex-1 min-w-0 px-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {p.isPinned && (
                      <Pin className="w-3 h-3 text-indigo-500 fill-indigo-500 shrink-0" />
                    )}
                    <Link
                      href={`/prompts/${p.id}`}
                      className="text-xs font-medium text-zinc-900 dark:text-zinc-100 hover:text-indigo-600 dark:hover:text-indigo-400 truncate hover:underline"
                    >
                      {p.title}
                    </Link>

                    {/* Target Platform badge */}
                    {p.targetPlatform && (
                      <Badge variant="outline" className="text-[9px] py-0 px-1 font-mono">
                        {p.targetPlatform}
                      </Badge>
                    )}

                    {/* Favorite status button */}
                    <button
                      type="button"
                      onClick={(e) => handleFavorite(p.id, e)}
                      className="text-zinc-300 hover:text-amber-500 dark:text-zinc-600 dark:hover:text-amber-400 transition-colors ml-1"
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${
                          p.isFavorite ? "text-amber-500 fill-amber-500" : ""
                        }`}
                      />
                    </button>
                  </div>

                  {/* Description snippet */}
                  {p.description && (
                    <p className="text-[11px] text-zinc-400 truncate mt-0.5">{p.description}</p>
                  )}

                  {/* Tags */}
                  {p.promptTags && p.promptTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {p.promptTags.slice(0, 4).map((pt) => (
                        <span
                          key={pt.tag.id}
                          className="text-[9px] px-1.5 py-0.2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-mono"
                        >
                          #{pt.tag.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Folder & Workspace Column */}
                <div className="hidden sm:flex flex-col w-36 px-2 shrink-0 text-[11px]">
                  {p.folder ? (
                    <span className="flex items-center gap-1 text-zinc-700 dark:text-zinc-300 truncate">
                      <Folder className="w-3 h-3 text-zinc-400 shrink-0" />
                      <span className="truncate">{p.folder.name}</span>
                    </span>
                  ) : (
                    <span className="text-zinc-400 italic text-[10px]">Unassigned</span>
                  )}
                  {p.workspace && (
                    <span className="text-[10px] text-zinc-400 truncate">
                      {p.workspace.name}
                    </span>
                  )}
                </div>

                {/* Tokens & Copies */}
                <div className="hidden md:flex flex-col items-end w-24 px-2 shrink-0 text-right font-mono text-[10px]">
                  <span className="text-zinc-600 dark:text-zinc-300">~{p.estimatedTokens} tok</span>
                  <span className="text-zinc-400">{p.copyCount} copies</span>
                </div>

                {/* Date */}
                <div className="w-24 px-2 shrink-0 text-right text-[10px] text-zinc-400 font-mono">
                  {formatDateShort(p.updatedAt)}
                </div>

                {/* Actions */}
                <div className="w-24 flex items-center justify-end gap-1 pr-1 shrink-0">
                  {/* Copy Button */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="iconSm"
                    onClick={(e) => handleCopy(p.id, p.content, e)}
                    className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                    title="Copy prompt"
                  >
                    {copiedId === p.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </Button>

                  {/* Actions Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="iconSm" className="text-zinc-400">
                        <MoreVertical className="w-3.5 h-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem asChild>
                        <Link href={`/prompts/${p.id}`} className="cursor-pointer">
                          Edit Prompt
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => handleDuplicate(p.id, e)}>
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => handlePin(p.id, e)}>
                        {p.isPinned ? "Unpin Prompt" : "Pin to Top"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {!p.isDeleted ? (
                        <>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.preventDefault();
                              toggleArchiveAction(p.id);
                              toast.success(p.isArchived ? "Unarchived" : "Archived");
                              router.refresh();
                            }}
                          >
                            {p.isArchived ? "Unarchive" : "Archive"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => handleSoftDelete(p.id, e)}
                            className="text-red-600 dark:text-red-400"
                          >
                            Move to Trash
                          </DropdownMenuItem>
                        </>
                      ) : (
                        <>
                          <DropdownMenuItem
                            onClick={(e) => handleRestore(p.id, e)}
                            className="text-emerald-600 dark:text-emerald-400"
                          >
                            Restore Prompt
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setPermDeleteId(p.id)}
                            className="text-red-600 dark:text-red-400"
                          >
                            Delete Permanently
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Permanent Delete Confirmation Dialog */}
      <AlertDialog open={!!permDeleteId} onOpenChange={(open) => !open && setPermDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently Delete Prompt?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All version revisions, attachments, and statistics associated with this prompt will be permanently erased.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePermanentDelete}>Delete Permanently</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
