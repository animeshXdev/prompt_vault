"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Tag as TagIcon, Plus, Edit, Trash2 } from "lucide-react";
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
import { createCategoryAction, updateCategoryAction, deleteCategoryAction } from "@/features/categories/actions";

interface CategoryRecord {
  id: string;
  name: string;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
  _count: { prompts: number };
}

export function CategoriesClient({ categories }: { categories: CategoryRecord[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryRecord | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<CategoryRecord | null>(null);
  const [reassignTargetId, setReassignTargetId] = useState<string>("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#3b82f6");

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setName("");
    setDescription("");
    setColor("#3b82f6");
    setModalOpen(true);
  };

  const handleOpenEdit = (cat: CategoryRecord) => {
    setEditingCategory(cat);
    setName(cat.name);
    setDescription(cat.description || "");
    setColor(cat.color || "#3b82f6");
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Category name is required");
      return;
    }

    startTransition(async () => {
      if (editingCategory) {
        const res = await updateCategoryAction(editingCategory.id, {
          name: name.trim(),
          description: description.trim() || null,
          color,
        });
        if (res.success) {
          toast.success("Category updated");
          setModalOpen(false);
          router.refresh();
        } else {
          toast.error(res.error || "Failed to update category");
        }
      } else {
        const res = await createCategoryAction({
          name: name.trim(),
          description: description.trim() || null,
          color,
        });
        if (res.success) {
          toast.success("Category created");
          setModalOpen(false);
          router.refresh();
        } else {
          toast.error(res.error || "Failed to create category");
        }
      }
    });
  };

  const handleDelete = () => {
    if (!deletingCategory) return;
    startTransition(async () => {
      const res = await deleteCategoryAction(deletingCategory.id, reassignTargetId || null);
      if (res.success) {
        toast.success("Category deleted and prompts reassigned");
        setDeleteModalOpen(false);
        setDeletingCategory(null);
        router.refresh();
      } else {
        toast.error(res.error || "Failed to delete category");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Prompt Categories
          </h1>
          <p className="text-xs text-zinc-500">
            Broad thematic groupings for classification and filtering.
          </p>
        </div>
        <Button size="sm" onClick={handleOpenCreate} className="gap-1.5 shadow-xs">
          <Plus className="w-3.5 h-3.5" />
          <span>New Category</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {categories.map((c) => (
          <div
            key={c.id}
            className="p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-2xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors flex flex-col justify-between"
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 truncate">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: c.color || "#3b82f6" }}
                  />
                  <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                    {c.name}
                  </h3>
                </div>
                <Badge variant="secondary" className="font-mono text-[10px]">
                  {c._count.prompts} prompts
                </Badge>
              </div>
              {c.description && (
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2">
                  {c.description}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 mt-2 border-t border-zinc-100 dark:border-zinc-800/60 text-xs">
              <Button asChild variant="link" size="sm" className="px-0 h-auto text-indigo-500">
                <a href={`/prompts?categoryId=${c.id}`}>Filter Prompts →</a>
              </Button>
              <div className="flex items-center gap-1">
                <Button size="iconSm" variant="ghost" onClick={() => handleOpenEdit(c)}>
                  <Edit className="w-3.5 h-3.5 text-zinc-400" />
                </Button>
                <Button
                  size="iconSm"
                  variant="ghost"
                  onClick={() => {
                    setDeletingCategory(c);
                    setReassignTargetId("");
                    setDeleteModalOpen(true);
                  }}
                  className="hover:text-red-500"
                >
                  <Trash2 className="w-3.5 h-3.5 text-zinc-400 hover:text-red-500" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create / Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Edit Category" : "Create Category"}</DialogTitle>
            <DialogDescription>
              Categories classify prompts by domain (e.g. Development, Writing, Architecture).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label htmlFor="cat-name">Category Name</Label>
              <Input
                id="cat-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. System Design"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="cat-desc">Description</Label>
              <Input
                id="cat-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description of this domain..."
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="cat-color">Color Accent</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="cat-color"
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
            <Button size="sm" onClick={handleSave} disabled={isPending}>
              {editingCategory ? "Update Category" : "Create Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category "{deletingCategory?.name}"?</DialogTitle>
            <DialogDescription>
              This category holds {deletingCategory?._count.prompts || 0} prompts. You can reassign them to another category to preserve metadata.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2 text-xs">
            <Label htmlFor="reassign-cat">Reassign prompts to:</Label>
            <select
              id="reassign-cat"
              value={reassignTargetId}
              onChange={(e) => setReassignTargetId(e.target.value)}
              className="w-full h-8 px-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs"
            >
              <option value="">Unassigned (Remove category tag)</option>
              {categories
                .filter((c) => deletingCategory && c.id !== deletingCategory.id)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
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
