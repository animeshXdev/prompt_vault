"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Folder, Plus, Edit, Trash2, ChevronRight, FolderTree, AlertCircle } from "lucide-react";
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
import { createFolderAction, updateFolderAction, deleteFolderAction } from "@/features/folders/actions";

interface FolderRecord {
  id: string;
  name: string;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
  parentId?: string | null;
  _count: { prompts: number };
}

export function FoldersClient({ folders }: { folders: FolderRecord[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<FolderRecord | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingFolder, setDeletingFolder] = useState<FolderRecord | null>(null);
  const [reassignTargetId, setReassignTargetId] = useState<string>("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#6366f1");
  const [parentId, setParentId] = useState("");

  const handleOpenCreate = () => {
    setEditingFolder(null);
    setName("");
    setDescription("");
    setColor("#6366f1");
    setParentId("");
    setModalOpen(true);
  };

  const handleOpenEdit = (folder: FolderRecord) => {
    setEditingFolder(folder);
    setName(folder.name);
    setDescription(folder.description || "");
    setColor(folder.color || "#6366f1");
    setParentId(folder.parentId || "");
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Folder name is required");
      return;
    }

    startTransition(async () => {
      if (editingFolder) {
        const res = await updateFolderAction(editingFolder.id, {
          name: name.trim(),
          description: description.trim() || null,
          color,
          parentId: parentId || null,
        });
        if (res.success) {
          toast.success("Folder updated");
          setModalOpen(false);
          router.refresh();
        } else {
          toast.error(res.error || "Failed to update folder");
        }
      } else {
        const res = await createFolderAction({
          name: name.trim(),
          description: description.trim() || null,
          color,
          parentId: parentId || null,
        });
        if (res.success) {
          toast.success("Folder created");
          setModalOpen(false);
          router.refresh();
        } else {
          toast.error(res.error || "Failed to create folder");
        }
      }
    });
  };

  const handleDelete = () => {
    if (!deletingFolder) return;
    startTransition(async () => {
      const res = await deleteFolderAction(deletingFolder.id, reassignTargetId || null);
      if (res.success) {
        toast.success("Folder deleted and prompts reassigned");
        setDeleteModalOpen(false);
        setDeletingFolder(null);
        router.refresh();
      } else {
        toast.error(res.error || "Failed to delete folder");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Folders & Hierarchies
          </h1>
          <p className="text-xs text-zinc-500">
            Organize prompts into color-coded folders and parent-child nested structures.
          </p>
        </div>
        <Button size="sm" onClick={handleOpenCreate} className="gap-1.5 shadow-xs">
          <Plus className="w-3.5 h-3.5" />
          <span>New Folder</span>
        </Button>
      </div>

      {folders.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg space-y-2">
          <Folder className="w-8 h-8 text-zinc-400 mx-auto" />
          <h3 className="text-xs font-semibold">No folders created yet</h3>
          <p className="text-[11px] text-zinc-500">Create folders to group related prompts together.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {folders.map((f) => (
            <div
              key={f.id}
              className="p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-2xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors flex flex-col justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: f.color || "#6366f1" }}
                    />
                    <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                      {f.name}
                    </h3>
                  </div>
                  <Badge variant="secondary" className="font-mono text-[10px]">
                    {f._count.prompts} prompts
                  </Badge>
                </div>
                {f.description && (
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2">
                    {f.description}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 mt-2 border-t border-zinc-100 dark:border-zinc-800/60 text-xs">
                <Button asChild variant="link" size="sm" className="px-0 h-auto text-indigo-500">
                  <a href={`/prompts?folderId=${f.id}`}>View Prompts →</a>
                </Button>
                <div className="flex items-center gap-1">
                  <Button
                    size="iconSm"
                    variant="ghost"
                    onClick={() => handleOpenEdit(f)}
                    title="Edit Folder"
                  >
                    <Edit className="w-3.5 h-3.5 text-zinc-400" />
                  </Button>
                  <Button
                    size="iconSm"
                    variant="ghost"
                    onClick={() => {
                      setDeletingFolder(f);
                      setReassignTargetId("");
                      setDeleteModalOpen(true);
                    }}
                    title="Delete Folder"
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

      {/* Create / Edit Folder Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingFolder ? "Edit Folder" : "Create Folder"}</DialogTitle>
            <DialogDescription>
              Folders help group related prompts and can be nested.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label htmlFor="folder-name">Folder Name</Label>
              <Input
                id="folder-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Backend Architecture"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="folder-desc">Description</Label>
              <Input
                id="folder-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="folder-color">Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    id="folder-color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="h-8 w-12 rounded border border-zinc-200 dark:border-zinc-800 bg-transparent cursor-pointer"
                  />
                  <span className="font-mono text-xs">{color}</span>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="folder-parent">Parent Folder</Label>
                <select
                  id="folder-parent"
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  className="w-full h-8 px-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs"
                >
                  <option value="">(None - Top Level)</option>
                  {folders
                    .filter((f) => !editingFolder || f.id !== editingFolder.id)
                    .map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isPending}>
              {editingFolder ? "Update Folder" : "Create Folder"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal with Reassignment Option */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Folder "{deletingFolder?.name}"?</DialogTitle>
            <DialogDescription>
              This folder currently holds {deletingFolder?._count.prompts || 0} prompts. You can reassign them to another folder to prevent data loss.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2 text-xs">
            <Label htmlFor="reassign-target">Reassign prompts to:</Label>
            <select
              id="reassign-target"
              value={reassignTargetId}
              onChange={(e) => setReassignTargetId(e.target.value)}
              className="w-full h-8 px-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs"
            >
              <option value="">Unassigned (Keep prompts, remove folder tag)</option>
              {folders
                .filter((f) => deletingFolder && f.id !== deletingFolder.id)
                .map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
            </select>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isPending}>
              Delete & Reassign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
