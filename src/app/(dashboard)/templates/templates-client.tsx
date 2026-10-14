"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileCode, Plus, Edit, Trash2, Play, Sparkles, ArrowRight, Layers } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { createTemplateAction, updateTemplateAction, deleteTemplateAction } from "@/features/templates/actions";
import { extractVariables } from "@/lib/templates/engine";

interface TemplateRecord {
  id: string;
  title: string;
  description?: string | null;
  templateContent: string;
  workspace?: { name: string } | null;
  variables: { name: string; label: string; fieldType: string; isRequired: boolean }[];
  _count: { presets: number };
}

export function TemplatesClient({
  templates,
  workspaces,
}: {
  templates: TemplateRecord[];
  workspaces: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TemplateRecord | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [workspaceId, setWorkspaceId] = useState("");

  const detectedVars = extractVariables(content);

  const handleOpenCreate = () => {
    setEditingTemplate(null);
    setTitle("");
    setDescription("");
    setContent(
      "Act as an expert {{role}} specializing in {{framework}}.\n\nContext:\n{{project_context}}\n\nTask:\n{{task_description}}\n\nStrict Constraints:\n- Adhere to {{coding_standards}}\n- Output format: {{output_format}}"
    );
    setWorkspaceId("");
    setModalOpen(true);
  };

  const handleOpenEdit = (t: TemplateRecord) => {
    setEditingTemplate(t);
    setTitle(t.title);
    setDescription(t.description || "");
    setContent(t.templateContent);
    setWorkspaceId(t.workspace ? (t as any).workspaceId || "" : "");
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Title and template content are required");
      return;
    }

    startTransition(async () => {
      if (editingTemplate) {
        const res = await updateTemplateAction(editingTemplate.id, {
          title: title.trim(),
          description: description.trim() || null,
          templateContent: content,
          workspaceId: workspaceId || null,
          variables: detectedVars.map((name) => ({
            name,
            label: name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
            fieldType: "text",
            isRequired: false,
          })),
        });
        if (res.success) {
          toast.success("Template updated");
          setModalOpen(false);
          router.refresh();
        } else {
          toast.error(res.error || "Failed to update template");
        }
      } else {
        const res = await createTemplateAction({
          title: title.trim(),
          description: description.trim() || null,
          templateContent: content,
          workspaceId: workspaceId || null,
          variables: detectedVars.map((name) => ({
            name,
            label: name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
            fieldType: "text",
            isRequired: false,
          })),
        });
        if (res.success && res.templateId) {
          toast.success("Template created");
          setModalOpen(false);
          router.push(`/templates/${res.templateId}`);
        } else {
          toast.error(res.error || "Failed to create template");
        }
      }
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Delete template "${name}"?`)) return;
    startTransition(async () => {
      const res = await deleteTemplateAction(id);
      if (res.success) {
        toast.success("Template deleted");
        router.refresh();
      } else {
        toast.error(res.error || "Failed to delete template");
      }
    });
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Dynamic Prompt Templates
          </h1>
          <p className="text-xs text-zinc-500">
            Parameterized prompt templates with auto-detected variable placeholders (`{"{{variable}}"}`).
          </p>
        </div>
        <Button size="sm" onClick={handleOpenCreate} className="gap-1.5 shadow-xs">
          <Plus className="w-3.5 h-3.5" />
          <span>New Template</span>
        </Button>
      </div>

      {templates.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg space-y-3">
          <FileCode className="w-8 h-8 text-zinc-400 mx-auto" />
          <h3 className="text-xs font-semibold">No prompt templates created yet</h3>
          <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
            Templates enable dynamic prompt generation using variables like `{"{{project_name}}"}` and `{"{{requirements}}"}`.
          </p>
          <Button size="sm" onClick={handleOpenCreate} className="mt-2">
            Create First Template
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {templates.map((t) => (
            <div
              key={t.id}
              className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-2xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 truncate">
                    <div className="p-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                      <FileCode className="w-4 h-4" />
                    </div>
                    <Link
                      href={`/templates/${t.id}`}
                      className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline truncate"
                    >
                      {t.title}
                    </Link>
                  </div>
                  {t.workspace && (
                    <Badge variant="outline" className="text-[10px] py-0 shrink-0">
                      {t.workspace.name}
                    </Badge>
                  )}
                </div>

                {t.description && (
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2">
                    {t.description}
                  </p>
                )}

                {/* Variable Pills */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {t.variables.map((v) => (
                    <Badge
                      key={v.name}
                      variant="secondary"
                      className="text-[9px] font-mono py-0"
                    >
                      {"{{" + v.name + "}}"}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-3 mt-3 border-t border-zinc-100 dark:border-zinc-800/60 text-xs">
                <Button asChild size="sm" variant="default" className="gap-1 h-7 text-xs">
                  <Link href={`/templates/${t.id}`}>
                    <Play className="w-3 h-3" />
                    <span>Run Template</span>
                  </Link>
                </Button>

                <div className="flex items-center gap-1">
                  <Button size="iconSm" variant="ghost" onClick={() => handleOpenEdit(t)}>
                    <Edit className="w-3.5 h-3.5 text-zinc-400" />
                  </Button>
                  <Button
                    size="iconSm"
                    variant="ghost"
                    onClick={() => handleDelete(t.id, t.title)}
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

      {/* Create / Edit Template Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? "Edit Template" : "Create Prompt Template"}</DialogTitle>
            <DialogDescription>
              Use `{"{{variable_name}}"}` anywhere in your text. Variables are automatically detected and parsed into form inputs.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label htmlFor="tpl-title">Template Title *</Label>
              <Input
                id="tpl-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Feature Implementation Blueprint"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="tpl-desc">Description</Label>
              <Input
                id="tpl-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description..."
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="tpl-ws">Workspace Scope</Label>
              <select
                id="tpl-ws"
                value={workspaceId}
                onChange={(e) => setWorkspaceId(e.target.value)}
                className="w-full h-8 px-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs"
              >
                <option value="">(Universal / Available in all Workspaces)</option>
                {workspaces.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="tpl-content">Template Content *</Label>
                {detectedVars.length > 0 && (
                  <span className="text-[10px] text-indigo-500 font-mono font-medium">
                    {detectedVars.length} variable{detectedVars.length > 1 ? "s" : ""} detected
                  </span>
                )}
              </div>
              <Textarea
                id="tpl-content"
                rows={7}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="font-mono text-xs leading-relaxed"
                placeholder="Write your prompt with {{variable}} placeholders..."
              />
            </div>

            {detectedVars.length > 0 && (
              <div className="flex flex-wrap gap-1 p-2 bg-zinc-50 dark:bg-zinc-900/60 rounded border border-zinc-200 dark:border-zinc-800">
                <span className="text-[10px] text-zinc-400 mr-1">Detected:</span>
                {detectedVars.map((v) => (
                  <Badge key={v} variant="outline" className="text-[9px] font-mono py-0">
                    {"{{" + v + "}}"}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isPending}>
              {editingTemplate ? "Update Template" : "Create Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
