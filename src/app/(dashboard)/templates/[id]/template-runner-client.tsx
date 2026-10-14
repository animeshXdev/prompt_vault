"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Play,
  Copy,
  Check,
  Save,
  BookmarkPlus,
  ArrowLeft,
  Sparkles,
  AlertCircle,
  FileCode,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { renderTemplate } from "@/lib/templates/engine";
import { estimateTokenCount } from "@/lib/utils";
import { createPromptAction } from "@/features/prompts/actions";
import { saveTemplatePresetAction } from "@/features/templates/actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TemplateRunnerProps {
  template: {
    id: string;
    title: string;
    description?: string | null;
    templateContent: string;
    workspace?: { id: string; name: string } | null;
    variables: {
      id: string;
      name: string;
      label: string;
      description?: string | null;
      fieldType: string;
      defaultValue?: string | null;
      isRequired: boolean;
      optionsJson?: string | null;
    }[];
    presets: {
      id: string;
      name: string;
      valuesJson: string;
    }[];
  };
}

export function TemplateRunnerClient({ template }: TemplateRunnerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Initialize values from default values
  const initialValues: Record<string, string> = {};
  for (const v of template.variables) {
    if (v.defaultValue) {
      initialValues[v.name] = v.defaultValue;
    }
  }

  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [copied, setCopied] = useState(false);
  const [presetModalOpen, setPresetModalOpen] = useState(false);
  const [presetName, setPresetName] = useState("");

  const requiredNames = template.variables.filter((v) => v.isRequired).map((v) => v.name);
  const { renderedText, missingVariables } = renderTemplate(
    template.templateContent,
    values,
    requiredNames
  );

  const tokenCount = estimateTokenCount(renderedText);

  const handleInputChange = (name: string, val: string) => {
    setValues((prev) => ({ ...prev, [name]: val }));
  };

  const handleApplyPreset = (valuesJson: string) => {
    try {
      const parsed = JSON.parse(valuesJson);
      setValues(parsed);
      toast.success("Applied preset values");
    } catch {
      toast.error("Invalid preset format");
    }
  };

  const handleSavePreset = () => {
    if (!presetName.trim()) {
      toast.error("Preset name is required");
      return;
    }

    startTransition(async () => {
      const res = await saveTemplatePresetAction(template.id, presetName.trim(), values);
      if (res.success) {
        toast.success(`Preset "${presetName}" saved`);
        setPresetModalOpen(false);
        setPresetName("");
        router.refresh();
      } else {
        toast.error(res.error || "Failed to save preset");
      }
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(renderedText);
    setCopied(true);
    toast.success("Interpolated prompt copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveAsPrompt = () => {
    startTransition(async () => {
      const res = await createPromptAction({
        title: `${template.title} (Generated)`,
        content: renderedText,
        workspaceId: template.workspace?.id || null,
        status: "active",
        isFavorite: false,
        isPinned: false,
        isArchived: false,
        tags: ["template-generated"],
      });

      if (res.success && res.promptId) {
        toast.success("Prompt saved to library");
        router.push(`/prompts/${res.promptId}`);
      } else {
        toast.error(res.error || "Failed to save prompt");
      }
    });
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="iconSm">
            <Link href="/templates">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                {template.title}
              </h1>
              {template.workspace && (
                <Badge variant="outline" className="text-[10px]">
                  {template.workspace.name}
                </Badge>
              )}
            </div>
            {template.description && (
              <p className="text-xs text-zinc-500 mt-0.5">{template.description}</p>
            )}
          </div>
        </div>

        {/* Presets and Actions */}
        <div className="flex items-center gap-2">
          {template.presets.length > 0 && (
            <select
              onChange={(e) => {
                if (e.target.value) handleApplyPreset(e.target.value);
              }}
              defaultValue=""
              className="h-8 px-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs"
            >
              <option value="" disabled>
                Load Saved Preset...
              </option>
              {template.presets.map((p) => (
                <option key={p.id} value={p.valuesJson}>
                  {p.name}
                </option>
              ))}
            </select>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPresetModalOpen(true)}
            className="gap-1.5"
          >
            <BookmarkPlus className="w-3.5 h-3.5" />
            <span>Save Preset</span>
          </Button>

          <Button size="sm" onClick={handleCopy} className="gap-1.5">
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Copy Prompt</span>
          </Button>
        </div>
      </div>

      {/* Main Split Grid: Variable Inputs (Left) & Real-time Live Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Form: Dynamic Variable Fields */}
        <div className="lg:col-span-5 space-y-4 bg-white dark:bg-zinc-900/60 p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-2xs">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5 text-emerald-500" />
              Template Variables ({template.variables.length})
            </h3>
            <span className="text-[10px] text-zinc-400">Fill inputs to generate prompt</span>
          </div>

          {template.variables.length === 0 ? (
            <p className="text-xs text-zinc-400 italic py-4 text-center">
              No dynamic variables detected in this template.
            </p>
          ) : (
            <div className="space-y-3.5">
              {template.variables.map((v) => {
                const val = values[v.name] || "";
                let options: string[] = [];
                if (v.optionsJson) {
                  try {
                    options = JSON.parse(v.optionsJson);
                  } catch {}
                }

                return (
                  <div key={v.id} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={`var-${v.name}`} className="flex items-center gap-1 font-mono text-[11px]">
                        <span>{v.label}</span>
                        {v.isRequired && <span className="text-red-500">*</span>}
                      </Label>
                      <span className="text-[10px] text-zinc-400 font-mono">{"{{" + v.name + "}}"}</span>
                    </div>

                    {v.description && (
                      <p className="text-[10px] text-zinc-400">{v.description}</p>
                    )}

                    {v.fieldType === "dropdown" && options.length > 0 ? (
                      <select
                        id={`var-${v.name}`}
                        value={val}
                        onChange={(e) => handleInputChange(v.name, e.target.value)}
                        className="w-full h-8 px-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs"
                      >
                        <option value="">Select an option...</option>
                        {options.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : v.fieldType === "multiline" ? (
                      <Textarea
                        id={`var-${v.name}`}
                        rows={3}
                        value={val}
                        onChange={(e) => handleInputChange(v.name, e.target.value)}
                        placeholder={`Enter ${v.label.toLowerCase()}...`}
                        className="text-xs"
                      />
                    ) : (
                      <Input
                        id={`var-${v.name}`}
                        value={val}
                        onChange={(e) => handleInputChange(v.name, e.target.value)}
                        placeholder={`Enter ${v.label.toLowerCase()}...`}
                        className="text-xs"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Output: Real-time Live Interpolation Preview */}
        <div className="lg:col-span-7 flex flex-col space-y-3">
          <div className="flex items-center justify-between p-2.5 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">Live Generated Prompt</span>
              <Badge variant="secondary" className="font-mono text-[10px]">
                ~{tokenCount} tokens
              </Badge>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={handleSaveAsPrompt}
              disabled={isPending}
              className="gap-1.5 h-7 text-xs"
            >
              {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3 text-indigo-500" />}
              Save as New Prompt
            </Button>
          </div>

          {missingVariables.length > 0 && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
              <span>
                Missing required variables:{" "}
                <strong className="font-mono">{missingVariables.map((v) => `{{${v}}}`).join(", ")}</strong>
              </span>
            </div>
          )}

          <div className="flex-1 min-h-[460px] p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 font-mono text-xs whitespace-pre-wrap leading-relaxed shadow-2xs overflow-y-auto">
            {renderedText}
          </div>
        </div>
      </div>

      {/* Save Preset Dialog */}
      <Dialog open={presetModalOpen} onOpenChange={setPresetModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Variable Preset</DialogTitle>
            <DialogDescription>
              Save the current set of variable values to quickly re-use them later.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <Label htmlFor="preset-name">Preset Name</Label>
            <Input
              id="preset-name"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="e.g. Next.js 16 Production Setup"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setPresetModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSavePreset} disabled={isPending}>
              Save Preset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
