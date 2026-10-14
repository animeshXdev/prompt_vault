"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Briefcase,
  FileText,
  Folder,
  Layers,
  ShieldCheck,
  Paperclip,
  Save,
  Plus,
  Loader2,
  Trash2,
  Copy,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PromptList } from "@/components/prompts/prompt-list";
import { PromptAttachmentsTab } from "@/components/prompts/prompt-attachments-tab";
import { updateWorkspaceAction, deleteWorkspaceAction } from "@/features/workspaces/actions";

interface WorkspaceHubProps {
  workspace: any;
}

export function WorkspaceHubClient({ workspace }: WorkspaceHubProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [isPending, startTransition] = useTransition();

  // Overview edit fields
  const [name, setName] = useState(workspace.name);
  const [description, setDescription] = useState(workspace.description || "");
  const [projectType, setProjectType] = useState(workspace.projectType || "");
  const [technologyStack, setTechnologyStack] = useState(workspace.technologyStack || "");
  const [customInstructions, setCustomInstructions] = useState(workspace.customInstructions || "");
  const [masterPrompt, setMasterPrompt] = useState(workspace.masterPrompt || "");

  const handleSaveOverview = () => {
    startTransition(async () => {
      const res = await updateWorkspaceAction(workspace.id, {
        name,
        description,
        projectType,
        technologyStack,
        customInstructions,
        masterPrompt,
      });

      if (res.success) {
        toast.success("Workspace details updated");
        router.refresh();
      } else {
        toast.error(res.error || "Failed to update workspace");
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Workspace Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                {workspace.name}
              </h1>
              {workspace.projectType && (
                <Badge variant="outline" className="text-[10px] font-medium">
                  {workspace.projectType}
                </Badge>
              )}
            </div>
            {workspace.description && (
              <p className="text-xs text-zinc-500 mt-0.5">{workspace.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild size="sm" className="gap-1.5 shadow-xs">
            <Link href={`/prompts/new?workspaceId=${workspace.id}`}>
              <Plus className="w-3.5 h-3.5" />
              <span>New Prompt</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" className="gap-1.5 text-xs">
            <Briefcase className="w-3.5 h-3.5" />
            <span>Overview & Standards</span>
          </TabsTrigger>
          <TabsTrigger value="prompts" className="gap-1.5 text-xs">
            <FileText className="w-3.5 h-3.5" />
            <span>Prompts ({workspace.prompts.length})</span>
          </TabsTrigger>
          <TabsTrigger value="rules" className="gap-1.5 text-xs">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Reusable Rules ({workspace.reusableRules.length})</span>
          </TabsTrigger>
          <TabsTrigger value="attachments" className="gap-1.5 text-xs">
            <Paperclip className="w-3.5 h-3.5" />
            <span>Attachments ({workspace.attachments.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Card className="p-3">
              <div className="text-[10px] text-zinc-500 font-medium">Scoped Prompts</div>
              <div className="text-xl font-bold mt-1 text-zinc-900 dark:text-zinc-100">{workspace.prompts.length}</div>
            </Card>
            <Card className="p-3">
              <div className="text-[10px] text-zinc-500 font-medium">Folders</div>
              <div className="text-xl font-bold mt-1 text-zinc-900 dark:text-zinc-100">{workspace.folders.length}</div>
            </Card>
            <Card className="p-3">
              <div className="text-[10px] text-zinc-500 font-medium">Active Rules</div>
              <div className="text-xl font-bold mt-1 text-zinc-900 dark:text-zinc-100">{workspace.reusableRules.length}</div>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-semibold">Workspace Standards & Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <Label htmlFor="hub-name">Workspace Name</Label>
                  <Input id="hub-name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="hub-type">Project Type</Label>
                  <Input id="hub-type" value={projectType} onChange={(e) => setProjectType(e.target.value)} />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="hub-stack">Technology Stack</Label>
                  <Input id="hub-stack" value={technologyStack} onChange={(e) => setTechnologyStack(e.target.value)} />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="hub-desc">Description</Label>
                  <Input id="hub-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="hub-instructions">Custom Workspace Instructions</Label>
                  <Textarea
                    id="hub-instructions"
                    rows={4}
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    placeholder="Specific architectural rules, coding standards, styling conventions, or output instructions..."
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="hub-master">Master System Prompt</Label>
                  <Textarea
                    id="hub-master"
                    rows={5}
                    value={masterPrompt}
                    onChange={(e) => setMasterPrompt(e.target.value)}
                    placeholder="Master system prompt to prepend during prompt composition..."
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button size="sm" onClick={handleSaveOverview} disabled={isPending} className="gap-1.5 font-semibold">
                  {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save Workspace Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Prompts Tab */}
        <TabsContent value="prompts">
          <PromptList prompts={workspace.prompts} folders={workspace.folders} />
        </TabsContent>

        {/* Rules Tab */}
        <TabsContent value="rules" className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-500">
              Rules specific to {workspace.name}. Combined in the visual Prompt Composer.
            </p>
            <Button asChild size="sm" variant="outline" className="gap-1">
              <Link href="/master-prompts">
                <Plus className="w-3.5 h-3.5" />
                <span>Manage Rules</span>
              </Link>
            </Button>
          </div>

          {workspace.reusableRules.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg italic">
              No rules scoped specifically to this workspace yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {workspace.reusableRules.map((rule: any) => (
                <div
                  key={rule.id}
                  className="p-3 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs space-y-1.5 bg-white dark:bg-zinc-900/60"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">{rule.title}</span>
                    <Badge variant="secondary" className="text-[10px] uppercase font-mono">
                      {rule.category}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-400 line-clamp-3 font-mono">
                    {rule.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Attachments Tab */}
        <TabsContent value="attachments">
          <PromptAttachmentsTab attachments={workspace.attachments} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
