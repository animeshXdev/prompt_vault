"use client";

import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PromptForm } from "@/components/prompts/prompt-form";
import { VersionDiffViewer, type VersionItem } from "@/components/prompts/version-diff-viewer";
import { PromptAttachmentsTab, type AttachmentItem } from "@/components/prompts/prompt-attachments-tab";
import { PromptAiTab } from "@/components/prompts/prompt-ai-tab";
import { FileText, History, Paperclip, Cpu } from "lucide-react";

interface PromptDetailTabsProps {
  prompt: any;
  folders: any[];
  categories: any[];
  workspaces: any[];
  allTags: any[];
  versions: VersionItem[];
  attachments: AttachmentItem[];
  aiHistory: any[];
}

export function PromptDetailTabs({
  prompt,
  folders,
  categories,
  workspaces,
  allTags,
  versions,
  attachments,
  aiHistory,
}: PromptDetailTabsProps) {
  const [activeTab, setActiveTab] = useState("editor");

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <TabsList>
          <TabsTrigger value="editor" className="gap-1.5 text-xs">
            <FileText className="w-3.5 h-3.5" />
            <span>Prompt Editor</span>
          </TabsTrigger>
          <TabsTrigger value="versions" className="gap-1.5 text-xs">
            <History className="w-3.5 h-3.5" />
            <span>Revisions & Diff ({versions.length})</span>
          </TabsTrigger>
          <TabsTrigger value="attachments" className="gap-1.5 text-xs">
            <Paperclip className="w-3.5 h-3.5" />
            <span>Attachments ({attachments.length})</span>
          </TabsTrigger>
          <TabsTrigger value="ai" className="gap-1.5 text-xs">
            <Cpu className="w-3.5 h-3.5" />
            <span>AI Playground</span>
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="editor" className="mt-0">
        <PromptForm
          initialData={prompt}
          folders={folders}
          categories={categories}
          workspaces={workspaces}
          allTags={allTags}
        />
      </TabsContent>

      <TabsContent value="versions" className="mt-0">
        <VersionDiffViewer
          promptId={prompt.id}
          currentContent={prompt.content}
          versions={versions}
        />
      </TabsContent>

      <TabsContent value="attachments" className="mt-0">
        <PromptAttachmentsTab
          promptId={prompt.id}
          attachments={attachments}
        />
      </TabsContent>

      <TabsContent value="ai" className="mt-0">
        <PromptAiTab
          promptId={prompt.id}
          promptContent={prompt.content}
          history={aiHistory}
        />
      </TabsContent>
    </Tabs>
  );
}
