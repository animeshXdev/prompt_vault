"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Hash, Plus, Trash2, Tag as TagIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createTagAction, deleteTagAction } from "@/features/tags/actions";

interface TagRecord {
  id: string;
  name: string;
  color?: string | null;
  _count: { promptTags: number };
}

export function TagsClient({ tags }: { tags: TagRecord[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#8b5cf6");

  const handleCreate = () => {
    if (!name.trim()) {
      toast.error("Tag name is required");
      return;
    }

    startTransition(async () => {
      const res = await createTagAction({
        name: name.trim().toLowerCase(),
        color,
      });

      if (res.success) {
        toast.success("Tag created");
        setName("");
        setModalOpen(false);
        router.refresh();
      } else {
        toast.error(res.error || "Failed to create tag");
      }
    });
  };

  const handleDelete = (id: string, tagName: string) => {
    startTransition(async () => {
      const res = await deleteTagAction(id);
      if (res.success) {
        toast.success(`Tag #${tagName} deleted`);
        router.refresh();
      } else {
        toast.error(res.error || "Failed to delete tag");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Tags & Keywords
          </h1>
          <p className="text-xs text-zinc-500">
            Multi-attribute indexing tags to cross-reference prompts across folders and workspaces.
          </p>
        </div>
        <Button size="sm" onClick={() => setModalOpen(true)} className="gap-1.5 shadow-xs">
          <Plus className="w-3.5 h-3.5" />
          <span>New Tag</span>
        </Button>
      </div>

      {tags.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg space-y-2">
          <Hash className="w-8 h-8 text-zinc-400 mx-auto" />
          <h3 className="text-xs font-semibold">No tags created yet</h3>
          <p className="text-[11px] text-zinc-500">Tags will be auto-created when you add them to prompts.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
          {tags.map((t) => (
            <div
              key={t.id}
              className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-2xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors flex items-center justify-between group"
            >
              <a
                href={`/prompts?tag=${encodeURIComponent(t.name)}`}
                className="flex items-center gap-1.5 truncate flex-1 hover:text-indigo-600 dark:hover:text-indigo-400"
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: t.color || "#8b5cf6" }}
                />
                <span className="font-mono text-xs font-medium truncate">#{t.name}</span>
                <span className="text-[10px] text-zinc-400 shrink-0 font-mono">
                  ({t._count.promptTags})
                </span>
              </a>

              <Button
                size="iconSm"
                variant="ghost"
                onClick={() => handleDelete(t.id, t.name)}
                className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500 w-6 h-6 p-0"
                title="Delete tag"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Tag</DialogTitle>
            <DialogDescription>
              Tags allow granular classification across multiple prompts.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label htmlFor="tag-name">Tag Name</Label>
              <Input
                id="tag-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. testing, architecture, prompt-craft"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="tag-color">Color Accent</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="tag-color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-8 w-12 rounded border border-zinc-200 dark:border-zinc-800 bg-transparent cursor-pointer"
                />
                <span className="font-mono text-xs">{color}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreate} disabled={isPending}>
              Create Tag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
