"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Plus,
  Edit,
  Trash2,
  Copy,
  Check,
  Power,
  ArrowUp,
  ArrowDown,
  Layers,
  Sparkles,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createMasterPromptAction,
  updateMasterPromptAction,
  deleteMasterPromptAction,
  createReusableRuleAction,
  updateReusableRuleAction,
  deleteReusableRuleAction,
  toggleReusableRuleAction,
} from "@/features/master-prompts/actions";

interface MasterPromptRecord {
  id: string;
  title: string;
  description?: string | null;
  content: string;
  isGlobal: boolean;
  workspaceId?: string | null;
  isActive: boolean;
  version: number;
  workspace?: { name: string } | null;
}

interface ReusableRuleRecord {
  id: string;
  title: string;
  category: string;
  content: string;
  priority: number;
  isEnabled: boolean;
  isGlobal: boolean;
  workspaceId?: string | null;
  version: number;
  workspace?: { name: string } | null;
}

interface MasterPromptsClientProps {
  masterPrompts: MasterPromptRecord[];
  reusableRules: ReusableRuleRecord[];
  workspaces: { id: string; name: string }[];
}

export function MasterPromptsClient({
  masterPrompts,
  reusableRules,
  workspaces,
}: MasterPromptsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState("rules");

  // Master Prompt Modal
  const [mpModalOpen, setMpModalOpen] = useState(false);
  const [editingMp, setEditingMp] = useState<MasterPromptRecord | null>(null);
  const [mpTitle, setMpTitle] = useState("");
  const [mpDesc, setMpDesc] = useState("");
  const [mpContent, setMpContent] = useState("");
  const [mpGlobal, setMpGlobal] = useState(true);
  const [mpWsId, setMpWsId] = useState("");

  // Rule Modal
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ReusableRuleRecord | null>(null);
  const [ruleTitle, setRuleTitle] = useState("");
  const [ruleCategory, setRuleCategory] = useState("coding");
  const [ruleContent, setRuleContent] = useState("");
  const [rulePriority, setRulePriority] = useState(0);
  const [ruleGlobal, setRuleGlobal] = useState(true);
  const [ruleWsId, setRuleWsId] = useState("");

  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Master Prompt Handlers
  const handleOpenCreateMp = () => {
    setEditingMp(null);
    setMpTitle("");
    setMpDesc("");
    setMpContent("");
    setMpGlobal(true);
    setMpWsId("");
    setMpModalOpen(true);
  };

  const handleOpenEditMp = (mp: MasterPromptRecord) => {
    setEditingMp(mp);
    setMpTitle(mp.title);
    setMpDesc(mp.description || "");
    setMpContent(mp.content);
    setMpGlobal(mp.isGlobal);
    setMpWsId(mp.workspaceId || "");
    setMpModalOpen(true);
  };

  const handleSaveMp = () => {
    if (!mpTitle.trim() || !mpContent.trim()) {
      toast.error("Title and content are required");
      return;
    }

    startTransition(async () => {
      if (editingMp) {
        const res = await updateMasterPromptAction(editingMp.id, {
          title: mpTitle.trim(),
          description: mpDesc.trim() || null,
          content: mpContent,
          isGlobal: mpGlobal,
          workspaceId: mpGlobal ? null : mpWsId || null,
          isActive: editingMp.isActive ?? true,
        });
        if (res.success) {
          toast.success("Master prompt updated");
          setMpModalOpen(false);
          router.refresh();
        } else {
          toast.error(res.error || "Failed to update");
        }
      } else {
        const res = await createMasterPromptAction({
          title: mpTitle.trim(),
          description: mpDesc.trim() || null,
          content: mpContent,
          isGlobal: mpGlobal,
          workspaceId: mpGlobal ? null : mpWsId || null,
          isActive: true,
        });
        if (res.success) {
          toast.success("Master prompt created");
          setMpModalOpen(false);
          router.refresh();
        } else {
          toast.error(res.error || "Failed to create");
        }
      }
    });
  };

  const handleDeleteMp = (id: string) => {
    if (!confirm("Are you sure you want to delete this master prompt?")) return;
    startTransition(async () => {
      const res = await deleteMasterPromptAction(id);
      if (res.success) {
        toast.success("Master prompt deleted");
        router.refresh();
      }
    });
  };

  // Rule Handlers
  const handleOpenCreateRule = () => {
    setEditingRule(null);
    setRuleTitle("");
    setRuleCategory("coding");
    setRuleContent("");
    setRulePriority(0);
    setRuleGlobal(true);
    setRuleWsId("");
    setRuleModalOpen(true);
  };

  const handleOpenEditRule = (r: ReusableRuleRecord) => {
    setEditingRule(r);
    setRuleTitle(r.title);
    setRuleCategory(r.category);
    setRuleContent(r.content);
    setRulePriority(r.priority);
    setRuleGlobal(r.isGlobal);
    setRuleWsId(r.workspaceId || "");
    setRuleModalOpen(true);
  };

  const handleSaveRule = () => {
    if (!ruleTitle.trim() || !ruleContent.trim()) {
      toast.error("Title and content are required");
      return;
    }

    startTransition(async () => {
      if (editingRule) {
        const res = await updateReusableRuleAction(editingRule.id, {
          title: ruleTitle.trim(),
          category: ruleCategory,
          content: ruleContent,
          priority: rulePriority,
          isGlobal: ruleGlobal,
          workspaceId: ruleGlobal ? null : ruleWsId || null,
          isEnabled: editingRule.isEnabled ?? true,
        });
        if (res.success) {
          toast.success("Rule updated");
          setRuleModalOpen(false);
          router.refresh();
        } else {
          toast.error(res.error || "Failed to update");
        }
      } else {
        const res = await createReusableRuleAction({
          title: ruleTitle.trim(),
          category: ruleCategory,
          content: ruleContent,
          priority: rulePriority,
          isGlobal: ruleGlobal,
          workspaceId: ruleGlobal ? null : ruleWsId || null,
          isEnabled: true,
        });
        if (res.success) {
          toast.success("Rule created");
          setRuleModalOpen(false);
          router.refresh();
        } else {
          toast.error(res.error || "Failed to create");
        }
      }
    });
  };

  const handleToggleRule = (id: string) => {
    startTransition(async () => {
      const res = await toggleReusableRuleAction(id);
      toast.success(res.isEnabled ? "Rule enabled" : "Rule disabled");
      router.refresh();
    });
  };

  const handleDeleteRule = (id: string) => {
    if (!confirm("Delete this reusable rule?")) return;
    startTransition(async () => {
      const res = await deleteReusableRuleAction(id);
      if (res.success) {
        toast.success("Rule deleted");
        router.refresh();
      }
    });
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const ruleCategories = [
    { id: "coding", label: "Coding Standards" },
    { id: "security", label: "Security & Validation" },
    { id: "architecture", label: "System Architecture" },
    { id: "ui_ux", label: "UI / UX Design" },
    { id: "testing", label: "Testing & Quality" },
    { id: "formatting", label: "Output Formatting" },
  ];

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Master Prompts & Modular Rules
          </h1>
          <p className="text-xs text-zinc-500">
            Define global instructions, security guardrails, coding standards, and assemble them in the visual Prompt Composer.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === "rules" ? (
            <Button size="sm" onClick={handleOpenCreateRule} className="gap-1.5 shadow-xs">
              <Plus className="w-3.5 h-3.5" />
              <span>New Instruction Rule</span>
            </Button>
          ) : (
            <Button size="sm" onClick={handleOpenCreateMp} className="gap-1.5 shadow-xs">
              <Plus className="w-3.5 h-3.5" />
              <span>New Master Prompt</span>
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="rules" className="gap-1.5 text-xs">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Modular Instruction Rules ({reusableRules.length})</span>
          </TabsTrigger>
          <TabsTrigger value="masters" className="gap-1.5 text-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Master System Prompts ({masterPrompts.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Reusable Instruction Rules */}
        <TabsContent value="rules" className="space-y-3 pt-2">
          {reusableRules.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg space-y-2">
              <ShieldCheck className="w-8 h-8 text-zinc-400 mx-auto" />
              <h3 className="text-xs font-semibold">No reusable instruction rules defined</h3>
              <p className="text-[11px] text-zinc-500">
                Create modular rules for coding standards, security, or formatting to combine in the Prompt Composer.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {reusableRules.map((rule) => (
                <div
                  key={rule.id}
                  className={`p-3.5 border rounded-lg bg-white dark:bg-zinc-900/60 shadow-2xs flex flex-col justify-between transition-all ${
                    rule.isEnabled
                      ? "border-zinc-200 dark:border-zinc-800"
                      : "border-zinc-200/50 dark:border-zinc-800/40 opacity-50 bg-zinc-50/50 dark:bg-zinc-950/40"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                          {rule.title}
                        </span>
                        <Badge variant="secondary" className="text-[10px] uppercase font-mono py-0">
                          {rule.category}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-zinc-400 font-mono">P:{rule.priority}</span>
                        <Switch
                          checked={rule.isEnabled}
                          onCheckedChange={() => handleToggleRule(rule.id)}
                          title="Enable / Disable Rule"
                        />
                      </div>
                    </div>

                    <p className="text-xs font-mono text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap line-clamp-4 bg-zinc-50 dark:bg-zinc-950 p-2 rounded border border-zinc-100 dark:border-zinc-850">
                      {rule.content}
                    </p>

                    <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                      {rule.isGlobal ? (
                        <Badge variant="outline" className="text-[9px] py-0">
                          Global Standard
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[9px] py-0">
                          Workspace: {rule.workspace?.name || "Local"}
                        </Badge>
                      )}
                      <span>• v{rule.version}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-1 pt-3 mt-2 border-t border-zinc-100 dark:border-zinc-800/60">
                    <Button
                      size="iconSm"
                      variant="ghost"
                      onClick={() => handleCopy(rule.id, rule.content)}
                      title="Copy Rule"
                    >
                      {copiedId === rule.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
                    </Button>
                    <Button
                      size="iconSm"
                      variant="ghost"
                      onClick={() => handleOpenEditRule(rule)}
                      title="Edit Rule"
                    >
                      <Edit className="w-3.5 h-3.5 text-zinc-400" />
                    </Button>
                    <Button
                      size="iconSm"
                      variant="ghost"
                      onClick={() => handleDeleteRule(rule.id)}
                      title="Delete Rule"
                      className="hover:text-red-500"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-zinc-400 hover:text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab 2: Master System Prompts */}
        <TabsContent value="masters" className="space-y-3 pt-2">
          {masterPrompts.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg space-y-2">
              <Sparkles className="w-8 h-8 text-zinc-400 mx-auto" />
              <h3 className="text-xs font-semibold">No master system prompts created</h3>
              <p className="text-[11px] text-zinc-500">
                Create comprehensive master instructions that anchor system prompts across all your projects.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {masterPrompts.map((mp) => (
                <div
                  key={mp.id}
                  className="p-3.5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900/60 shadow-2xs flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                        {mp.title}
                      </h3>
                      <div className="flex items-center gap-1.5">
                        {mp.isGlobal ? (
                          <Badge variant="outline" className="text-[10px]">
                            Global
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px]">
                            {mp.workspace?.name}
                          </Badge>
                        )}
                        <span className="text-[10px] text-zinc-400 font-mono">v{mp.version}</span>
                      </div>
                    </div>

                    {mp.description && (
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2">
                        {mp.description}
                      </p>
                    )}

                    <p className="text-xs font-mono text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap line-clamp-4 bg-zinc-50 dark:bg-zinc-950 p-2 rounded border border-zinc-100 dark:border-zinc-850">
                      {mp.content}
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-1 pt-3 mt-2 border-t border-zinc-100 dark:border-zinc-800/60">
                    <Button
                      size="iconSm"
                      variant="ghost"
                      onClick={() => handleCopy(mp.id, mp.content)}
                      title="Copy Master Prompt"
                    >
                      {copiedId === mp.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
                    </Button>
                    <Button
                      size="iconSm"
                      variant="ghost"
                      onClick={() => handleOpenEditMp(mp)}
                      title="Edit Master Prompt"
                    >
                      <Edit className="w-3.5 h-3.5 text-zinc-400" />
                    </Button>
                    <Button
                      size="iconSm"
                      variant="ghost"
                      onClick={() => handleDeleteMp(mp.id)}
                      title="Delete Master Prompt"
                      className="hover:text-red-500"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-zinc-400 hover:text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Rule Edit / Create Modal */}
      <Dialog open={ruleModalOpen} onOpenChange={setRuleModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingRule ? "Edit Instruction Rule" : "Create Instruction Rule"}</DialogTitle>
            <DialogDescription>
              Rules can be toggled and combined dynamically into prompts using the Composer.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label htmlFor="r-title">Rule Title</Label>
              <Input
                id="r-title"
                value={ruleTitle}
                onChange={(e) => setRuleTitle(e.target.value)}
                placeholder="e.g. Strict Type Checking & No Any"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="r-cat">Category</Label>
                <select
                  id="r-cat"
                  value={ruleCategory}
                  onChange={(e) => setRuleCategory(e.target.value)}
                  className="w-full h-8 px-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs"
                >
                  {ruleCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="r-prio">Priority (Higher runs first)</Label>
                <Input
                  id="r-prio"
                  type="number"
                  value={rulePriority}
                  onChange={(e) => setRulePriority(parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="r-content">Instruction Rule Content</Label>
              <Textarea
                id="r-content"
                rows={5}
                value={ruleContent}
                onChange={(e) => setRuleContent(e.target.value)}
                placeholder="Write the exact rule constraints that AI models must follow..."
                className="font-mono text-xs"
              />
            </div>

            <div className="flex items-center gap-4 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={ruleGlobal}
                  onChange={(e) => setRuleGlobal(e.target.checked)}
                  className="rounded"
                />
                <span>Apply globally across all workspaces</span>
              </label>

              {!ruleGlobal && (
                <div className="flex-1">
                  <select
                    value={ruleWsId}
                    onChange={(e) => setRuleWsId(e.target.value)}
                    className="w-full h-8 px-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs"
                  >
                    <option value="">Select Workspace</option>
                    {workspaces.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setRuleModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveRule} disabled={isPending}>
              {editingRule ? "Update Rule" : "Create Rule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Master Prompt Edit / Create Modal */}
      <Dialog open={mpModalOpen} onOpenChange={setMpModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingMp ? "Edit Master Prompt" : "Create Master Prompt"}</DialogTitle>
            <DialogDescription>
              Comprehensive master system prompts defining core personas and objectives.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label htmlFor="mp-title">Title</Label>
              <Input
                id="mp-title"
                value={mpTitle}
                onChange={(e) => setMpTitle(e.target.value)}
                placeholder="e.g. Senior Full-Stack Architect Persona"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="mp-desc">Description</Label>
              <Input
                id="mp-desc"
                value={mpDesc}
                onChange={(e) => setMpDesc(e.target.value)}
                placeholder="Brief summary..."
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="mp-content">System Prompt Content</Label>
              <Textarea
                id="mp-content"
                rows={6}
                value={mpContent}
                onChange={(e) => setMpContent(e.target.value)}
                placeholder="Act as a senior engineer..."
                className="font-mono text-xs"
              />
            </div>

            <div className="flex items-center gap-4 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={mpGlobal}
                  onChange={(e) => setMpGlobal(e.target.checked)}
                  className="rounded"
                />
                <span>Global Master Prompt</span>
              </label>

              {!mpGlobal && (
                <div className="flex-1">
                  <select
                    value={mpWsId}
                    onChange={(e) => setMpWsId(e.target.value)}
                    className="w-full h-8 px-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs"
                  >
                    <option value="">Select Workspace</option>
                    {workspaces.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setMpModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveMp} disabled={isPending}>
              {editingMp ? "Update Master Prompt" : "Create Master Prompt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
