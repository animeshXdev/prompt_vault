"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Save,
  Star,
  Pin,
  Sparkles,
  Tag as TagIcon,
  Folder,
  Briefcase,
  Layers,
  Cpu,
  ChevronDown,
  Loader2,
  FileText,
} from "lucide-react";
import { promptSchema, type PromptInput } from "@/lib/validations/prompt";
import { createPromptAction, updatePromptAction } from "@/features/prompts/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PromptEditor } from "@/components/editor/prompt-editor";

interface PromptFormProps {
  initialData?: {
    id: string;
    title: string;
    description?: string | null;
    content: string;
    notes?: string | null;
    folderId?: string | null;
    categoryId?: string | null;
    workspaceId?: string | null;
    targetPlatform?: string | null;
    targetModel?: string | null;
    isFavorite: boolean;
    isPinned: boolean;
    isArchived: boolean;
    status: "draft" | "active" | "archived";
    promptTags?: { tag: { name: string } }[];
  };
  folders?: { id: string; name: string }[];
  categories?: { id: string; name: string }[];
  workspaces?: { id: string; name: string }[];
  allTags?: { id: string; name: string }[];
}

export function PromptForm({
  initialData,
  folders = [],
  categories = [],
  workspaces = [],
  allTags = [],
}: PromptFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [promptContent, setPromptContent] = useState(initialData?.content || "");
  const [tags, setTags] = useState<string[]>(
    initialData?.promptTags ? initialData.promptTags.map((pt) => pt.tag.name) : []
  );
  const [tagInput, setTagInput] = useState("");
  const [isFavorite, setIsFavorite] = useState(initialData?.isFavorite || false);
  const [isPinned, setIsPinned] = useState(initialData?.isPinned || false);
  const [status, setStatus] = useState<"draft" | "active" | "archived">(
    initialData?.status || "active"
  );
  const [showMetadata, setShowMetadata] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PromptInput>({
    resolver: zodResolver(promptSchema) as any,
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      content: initialData?.content || "",
      notes: initialData?.notes || "",
      folderId: initialData?.folderId || null,
      categoryId: initialData?.categoryId || null,
      workspaceId: initialData?.workspaceId || null,
      targetPlatform: initialData?.targetPlatform || "openai",
      targetModel: initialData?.targetModel || "",
      isFavorite: initialData?.isFavorite || false,
      isPinned: initialData?.isPinned || false,
      isArchived: initialData?.isArchived || false,
      status: initialData?.status || "active",
      tags: initialData?.promptTags ? initialData.promptTags.map((pt) => pt.tag.name) : [],
    },
  });

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const trimmed = tagInput.trim().toLowerCase().replace(/,/g, "");
      if (trimmed && !tags.includes(trimmed)) {
        setTags([...tags, trimmed]);
        setTagInput("");
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const onSubmit = (data: PromptInput) => {
    if (!promptContent.trim()) {
      toast.error("Prompt content cannot be empty");
      return;
    }

    startTransition(async () => {
      const payload: PromptInput = {
        ...data,
        content: promptContent,
        tags,
        isFavorite,
        isPinned,
        status,
      };

      if (initialData?.id) {
        const res = await updatePromptAction(initialData.id, payload);
        if (res.success) {
          toast.success("Prompt updated successfully");
          router.refresh();
        } else {
          toast.error(res.error || "Failed to update prompt");
        }
      } else {
        const res = await createPromptAction(payload);
        if (res.success && res.promptId) {
          toast.success("Prompt created successfully");
          router.push(`/prompts/${res.promptId}`);
        } else {
          toast.error(res.error || "Failed to create prompt");
        }
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Top Header & Quick Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex-1 min-w-[280px]">
          <Input
            id="prompt-title"
            placeholder="Prompt Title (e.g. Next.js Architecture Specialist)"
            className="text-base font-semibold h-10 border-none shadow-none focus-visible:ring-0 px-0 bg-transparent placeholder:text-zinc-400"
            {...register("title")}
          />
          {errors.title && (
            <p className="text-[11px] text-red-500">{errors.title.message}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Favorite Toggle */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsFavorite(!isFavorite)}
            className={`gap-1 ${isFavorite ? "text-amber-500 border-amber-200 dark:border-amber-900/60" : ""}`}
          >
            <Star className={`w-3.5 h-3.5 ${isFavorite ? "fill-amber-500" : ""}`} />
            <span className="hidden sm:inline">Favorite</span>
          </Button>

          {/* Pin Toggle */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsPinned(!isPinned)}
            className={`gap-1 ${isPinned ? "text-indigo-500 border-indigo-200 dark:border-indigo-900/60" : ""}`}
          >
            <Pin className={`w-3.5 h-3.5 ${isPinned ? "fill-indigo-500" : ""}`} />
            <span className="hidden sm:inline">Pin</span>
          </Button>

          {/* Metadata Collapsible */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowMetadata(!showMetadata)}
            className="gap-1"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Metadata</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${showMetadata ? "rotate-180" : ""}`} />
          </Button>

          {/* Save Button */}
          <Button type="submit" size="sm" disabled={isPending} className="gap-1.5 font-semibold">
            {isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>{initialData?.id ? "Update Prompt" : "Save Prompt"}</span>
          </Button>
        </div>
      </div>

      {/* Metadata Panel (Collapsible or visible) */}
      {showMetadata && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-3 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs animate-in fade-in">
          {/* Folder */}
          <div className="space-y-1">
            <Label htmlFor="folderId">Folder</Label>
            <select
              id="folderId"
              {...register("folderId")}
              className="w-full h-8 px-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs"
            >
              <option value="">(None / Root)</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div className="space-y-1">
            <Label htmlFor="categoryId">Category</Label>
            <select
              id="categoryId"
              {...register("categoryId")}
              className="w-full h-8 px-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs"
            >
              <option value="">(Uncategorized)</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Workspace */}
          <div className="space-y-1">
            <Label htmlFor="workspaceId">Project Workspace</Label>
            <select
              id="workspaceId"
              {...register("workspaceId")}
              className="w-full h-8 px-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs"
            >
              <option value="">(Global / No Workspace)</option>
              {workspaces.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          {/* Target Platform & Model */}
          <div className="space-y-1">
            <Label htmlFor="targetPlatform">Target Platform</Label>
            <select
              id="targetPlatform"
              {...register("targetPlatform")}
              className="w-full h-8 px-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs"
            >
              <option value="openai">OpenAI (GPT-4o, etc.)</option>
              <option value="anthropic">Anthropic (Claude 3.7)</option>
              <option value="gemini">Google Gemini</option>
              <option value="ollama">Ollama (Local LLM)</option>
              <option value="openrouter">OpenRouter</option>
              <option value="other">Universal / Agnostic</option>
            </select>
          </div>

          {/* Description */}
          <div className="sm:col-span-2 space-y-1">
            <Label htmlFor="description">Short Description / Summary</Label>
            <Input
              id="description"
              placeholder="Brief description of the prompt purpose..."
              {...register("description")}
            />
          </div>

          {/* Notes */}
          <div className="sm:col-span-2 space-y-1">
            <Label htmlFor="notes">Usage Notes & Guidelines</Label>
            <Input
              id="notes"
              placeholder="Recommended temperature, token limit, or persona instructions..."
              {...register("notes")}
            />
          </div>

          {/* Tags */}
          <div className="sm:col-span-4 space-y-1">
            <Label>Tags (Press Enter or comma to add)</Label>
            <div className="flex flex-wrap items-center gap-1.5 p-1.5 border border-zinc-200 dark:border-zinc-800 rounded-md bg-white dark:bg-zinc-900 min-h-8">
              {tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="gap-1 text-[10px] py-0 font-mono"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-red-500 font-bold ml-0.5"
                  >
                    ×
                  </button>
                </Badge>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder={tags.length === 0 ? "Add tags e.g. coding, security, react..." : ""}
                className="flex-1 min-w-[120px] bg-transparent text-xs outline-none px-1"
              />
            </div>
          </div>
        </div>
      )}

      {/* CodeMirror Prompt Editor */}
      <div className="h-[580px]">
        <PromptEditor
          initialContent={promptContent}
          initialTitle={watch("title")}
          onSave={async (newContent) => {
            setPromptContent(newContent);
          }}
        />
      </div>
    </form>
  );
}
