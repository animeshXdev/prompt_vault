"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Plus,
  ArrowUp,
  ArrowDown,
  Trash2,
  Copy,
  Check,
  Save,
  Layers,
  ShieldCheck,
  FileText,
  AlertTriangle,
  Folder,
  Eye,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { estimateTokenCount } from "@/lib/utils";
import { saveCompositionAction } from "@/features/composer/actions";

export interface ComposerBlock {
  id: string;
  blockType: "global_master" | "workspace_rule" | "saved_prompt" | "reusable_rule" | "custom_text" | "output_format";
  referenceId?: string | null;
  title: string;
  content: string;
  orderIndex: number;
  isEnabled: boolean;
}

interface ComposerClientProps {
  masterPrompts: any[];
  reusableRules: any[];
  savedPrompts: any[];
  workspaces: any[];
  existingCompositions: any[];
}

export function ComposerClient({
  masterPrompts,
  reusableRules,
  savedPrompts,
  workspaces,
  existingCompositions,
}: ComposerClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [compositionTitle, setCompositionTitle] = useState("New Prompt Composition");
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("");
  const [blocks, setBlocks] = useState<ComposerBlock[]>([]);
  const [copied, setCopied] = useState(false);

  // Add block from library
  const handleAddMasterPrompt = (mp: any) => {
    const newBlock: ComposerBlock = {
      id: `mp-${Date.now()}-${Math.random()}`,
      blockType: "global_master",
      referenceId: mp.id,
      title: `[Master] ${mp.title}`,
      content: mp.content,
      orderIndex: blocks.length,
      isEnabled: true,
    };
    setBlocks([...blocks, newBlock]);
    toast.success(`Added "${mp.title}"`);
  };

  const handleAddRule = (rule: any) => {
    const newBlock: ComposerBlock = {
      id: `rule-${Date.now()}-${Math.random()}`,
      blockType: "reusable_rule",
      referenceId: rule.id,
      title: `[Rule] ${rule.title}`,
      content: rule.content,
      orderIndex: blocks.length,
      isEnabled: true,
    };
    setBlocks([...blocks, newBlock]);
    toast.success(`Added rule "${rule.title}"`);
  };

  const handleAddSavedPrompt = (prompt: any) => {
    const newBlock: ComposerBlock = {
      id: `p-${Date.now()}-${Math.random()}`,
      blockType: "saved_prompt",
      referenceId: prompt.id,
      title: `[Prompt] ${prompt.title}`,
      content: prompt.content,
      orderIndex: blocks.length,
      isEnabled: true,
    };
    setBlocks([...blocks, newBlock]);
    toast.success(`Added prompt "${prompt.title}"`);
  };

  const handleAddCustomBlock = (type: "custom_text" | "output_format") => {
    const isFormat = type === "output_format";
    const newBlock: ComposerBlock = {
      id: `custom-${Date.now()}-${Math.random()}`,
      blockType: type,
      referenceId: null,
      title: isFormat ? "Output Formatting Specification" : "Task Context & Directives",
      content: isFormat
        ? "Please format the output cleanly using Markdown. Provide working, complete implementations without placeholders or elided sections."
        : "Task details:\n",
      orderIndex: blocks.length,
      isEnabled: true,
    };
    setBlocks([...blocks, newBlock]);
  };

  const handleMoveBlock = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;

    const newBlocks = [...blocks];
    const temp = newBlocks[index];
    newBlocks[index] = newBlocks[targetIndex];
    newBlocks[targetIndex] = temp;

    setBlocks(newBlocks);
  };

  const handleToggleBlock = (index: number) => {
    const newBlocks = [...blocks];
    newBlocks[index].isEnabled = !newBlocks[index].isEnabled;
    setBlocks(newBlocks);
  };

  const handleRemoveBlock = (index: number) => {
    setBlocks(blocks.filter((_, i) => i !== index));
  };

  const handleBlockContentChange = (index: number, val: string) => {
    const newBlocks = [...blocks];
    newBlocks[index].content = val;
    setBlocks(newBlocks);
  };

  // Load existing composition
  const handleLoadComposition = (comp: any) => {
    setCompositionTitle(comp.title);
    setSelectedWorkspaceId(comp.workspaceId || "");
    setBlocks(
      comp.blocks.map((b: any, idx: number) => ({
        id: b.id || `b-${idx}`,
        blockType: b.blockType,
        referenceId: b.referenceId,
        title: b.title,
        content: b.content,
        orderIndex: idx,
        isEnabled: b.isEnabled,
      }))
    );
    toast.success(`Loaded "${comp.title}"`);
  };

  // Duplicate block detection
  const seenContents = new Set<string>();
  const duplicateIndices = new Set<number>();
  blocks.forEach((b, idx) => {
    const trimmed = b.content.trim();
    if (seenContents.has(trimmed) && trimmed.length > 10) {
      duplicateIndices.add(idx);
    } else {
      seenContents.add(trimmed);
    }
  });

  // Combined text
  const combinedText = blocks
    .filter((b) => b.isEnabled)
    .map((b) => b.content.trim())
    .filter(Boolean)
    .join("\n\n---\n\n");

  const tokenCount = estimateTokenCount(combinedText);

  const handleCopy = () => {
    if (!combinedText) {
      toast.error("Composition is empty");
      return;
    }
    navigator.clipboard.writeText(combinedText);
    setCopied(true);
    toast.success("Assembled prompt copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    if (!compositionTitle.trim()) {
      toast.error("Composition title is required");
      return;
    }

    startTransition(async () => {
      const res = await saveCompositionAction({
        title: compositionTitle.trim(),
        workspaceId: selectedWorkspaceId || null,
        blocks: blocks.map((b, idx) => ({ ...b, orderIndex: idx })),
      });

      if (res.success) {
        toast.success("Composition saved successfully");
        router.refresh();
      } else {
        toast.error(res.error || "Failed to save composition");
      }
    });
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Input
                value={compositionTitle}
                onChange={(e) => setCompositionTitle(e.target.value)}
                placeholder="Composition Title..."
                className="text-base font-bold h-8 border-none shadow-none focus-visible:ring-0 px-0 bg-transparent"
              />
            </div>
            <p className="text-xs text-zinc-500">
              Combine master personas, workspace rules, and prompt modules into a unified prompt.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {existingCompositions.length > 0 && (
            <select
              onChange={(e) => {
                const comp = existingCompositions.find((c) => c.id === e.target.value);
                if (comp) handleLoadComposition(comp);
              }}
              defaultValue=""
              className="h-8 px-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs"
            >
              <option value="" disabled>
                Load Saved Composition...
              </option>
              {existingCompositions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          )}

          <Button size="sm" variant="outline" onClick={handleSave} disabled={isPending} className="gap-1.5">
            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save Composition
          </Button>

          <Button size="sm" onClick={handleCopy} className="gap-1.5 shadow-xs">
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            Copy Combined Prompt
          </Button>
        </div>
      </div>

      {/* Main Grid: Available Library Modules (Left), Active Assembly Stack (Center), Live Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Library Drawer of Modules */}
        <div className="lg:col-span-3 space-y-4">
          <div className="p-3 bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-lg space-y-3">
            <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
              Add Modules
            </h3>

            {/* Custom Directives */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-zinc-400 font-medium block">Custom Blocks</span>
              <div className="grid grid-cols-2 gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAddCustomBlock("custom_text")}
                  className="text-[11px] h-7"
                >
                  + Task Context
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAddCustomBlock("output_format")}
                  className="text-[11px] h-7"
                >
                  + Format Rule
                </Button>
              </div>
            </div>

            {/* Master Prompts */}
            {masterPrompts.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] text-zinc-400 font-medium block">Master Personas</span>
                <div className="space-y-1 max-h-36 overflow-y-auto">
                  {masterPrompts.map((mp) => (
                    <button
                      key={mp.id}
                      type="button"
                      onClick={() => handleAddMasterPrompt(mp)}
                      className="w-full text-left p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-[11px] truncate flex items-center justify-between group"
                    >
                      <span className="truncate">{mp.title}</span>
                      <Plus className="w-3 h-3 text-zinc-400 group-hover:text-indigo-500 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Reusable Rules */}
            {reusableRules.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] text-zinc-400 font-medium block">Instruction Rules</span>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {reusableRules.map((rule) => (
                    <button
                      key={rule.id}
                      type="button"
                      onClick={() => handleAddRule(rule)}
                      className="w-full text-left p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-[11px] truncate flex items-center justify-between group"
                    >
                      <span className="truncate">{rule.title}</span>
                      <Plus className="w-3 h-3 text-zinc-400 group-hover:text-indigo-500 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Saved Prompts */}
            {savedPrompts.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] text-zinc-400 font-medium block">Prompts from Vault</span>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {savedPrompts.slice(0, 10).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleAddSavedPrompt(p)}
                      className="w-full text-left p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-[11px] truncate flex items-center justify-between group"
                    >
                      <span className="truncate">{p.title}</span>
                      <Plus className="w-3 h-3 text-zinc-400 group-hover:text-indigo-500 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center Column: Active Assembled Block Stack */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-500" />
              Assembled Blocks ({blocks.length})
            </h3>
            <span className="text-[10px] text-zinc-400">Reorder with arrows, toggle on/off</span>
          </div>

          {blocks.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg text-xs text-zinc-400 italic">
              Click modules on the left to add them to your prompt composition.
            </div>
          ) : (
            <div className="space-y-2.5">
              {blocks.map((block, idx) => {
                const isDuplicate = duplicateIndices.has(idx);

                return (
                  <div
                    key={block.id}
                    className={`p-3 rounded-lg border bg-white dark:bg-zinc-900/70 shadow-2xs space-y-2 transition-all ${
                      block.isEnabled
                        ? "border-zinc-200 dark:border-zinc-800"
                        : "border-zinc-200/50 dark:border-zinc-800/40 opacity-50 bg-zinc-50 dark:bg-zinc-950"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-[10px] font-mono text-zinc-400">#{idx + 1}</span>
                        <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                          {block.title}
                        </span>
                        {isDuplicate && (
                          <Badge variant="destructive" className="gap-1 text-[9px] py-0">
                            <AlertTriangle className="w-2.5 h-2.5" /> Duplicate
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <Switch
                          checked={block.isEnabled}
                          onCheckedChange={() => handleToggleBlock(idx)}
                          title="Enable / Disable Block"
                        />
                        <Button
                          size="iconSm"
                          variant="ghost"
                          onClick={() => handleMoveBlock(idx, "up")}
                          disabled={idx === 0}
                          className="w-6 h-6 p-0"
                        >
                          <ArrowUp className="w-3 h-3 text-zinc-400" />
                        </Button>
                        <Button
                          size="iconSm"
                          variant="ghost"
                          onClick={() => handleMoveBlock(idx, "down")}
                          disabled={idx === blocks.length - 1}
                          className="w-6 h-6 p-0"
                        >
                          <ArrowDown className="w-3 h-3 text-zinc-400" />
                        </Button>
                        <Button
                          size="iconSm"
                          variant="ghost"
                          onClick={() => handleRemoveBlock(idx)}
                          className="w-6 h-6 p-0 hover:text-red-500"
                        >
                          <Trash2 className="w-3 h-3 text-zinc-400 hover:text-red-500" />
                        </Button>
                      </div>
                    </div>

                    <Textarea
                      rows={3}
                      value={block.content}
                      onChange={(e) => handleBlockContentChange(idx, e.target.value)}
                      className="font-mono text-xs leading-relaxed bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Combined Assembled Output Preview */}
        <div className="lg:col-span-4 flex flex-col space-y-2">
          <div className="flex items-center justify-between p-2 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs">
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">Combined Output</span>
            <Badge variant="secondary" className="font-mono text-[10px]">
              ~{tokenCount} tokens
            </Badge>
          </div>

          <div className="flex-1 min-h-[480px] p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 font-mono text-xs whitespace-pre-wrap leading-relaxed overflow-y-auto shadow-2xs">
            {combinedText || (
              <span className="text-zinc-400 italic">Assembled prompt will render here...</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
