"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Paperclip,
  Upload,
  Download,
  Trash2,
  FileText,
  Briefcase,
  Loader2,
  HardDrive,
  FileArchive,
  FileCode,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatBytes, formatDate } from "@/lib/utils";
import { uploadAttachmentAction, deleteAttachmentAction } from "@/features/attachments/actions";

interface FileItem {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  createdAt: Date | string;
  prompt?: { id: string; title: string } | null;
  workspace?: { id: string; name: string } | null;
}

export function FilesClient({
  files,
  prompts,
  workspaces,
}: {
  files: FileItem[];
  prompts: { id: string; title: string }[];
  workspaces: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [selectedPromptId, setSelectedPromptId] = useState("");
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("");

  const totalBytes = files.reduce((acc, f) => acc + f.fileSize, 0);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    if (selectedPromptId) formData.append("promptId", selectedPromptId);
    if (selectedWorkspaceId) formData.append("workspaceId", selectedWorkspaceId);

    startTransition(async () => {
      const res = await uploadAttachmentAction(formData);
      if (res.success) {
        toast.success(`Attached "${file.name}"`);
        router.refresh();
      } else {
        toast.error(res.error || "Upload failed");
      }
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Delete "${name}" from storage?`)) return;

    startTransition(async () => {
      const res = await deleteAttachmentAction(id);
      if (res.success) {
        toast.success("File deleted");
        router.refresh();
      } else {
        toast.error(res.error || "Failed to delete file");
      }
    });
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Private File Attachments
          </h1>
          <p className="text-xs text-zinc-500">
            Secure persistent file storage for reference specifications, context documents, and archives.
          </p>
        </div>

        {/* Upload Controls */}
        <div className="flex items-center gap-2 text-xs">
          <label className="cursor-pointer">
            <input
              type="file"
              onChange={handleFileUpload}
              disabled={isPending}
              className="hidden"
              accept=".txt,.md,.json,.pdf,.zip"
            />
            <Button asChild size="sm" className="gap-1.5 cursor-pointer shadow-xs" disabled={isPending}>
              <span>
                {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                Upload New File
              </span>
            </Button>
          </label>
        </div>
      </div>

      {/* Storage Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="p-3">
          <div className="text-[10px] text-zinc-500 font-medium">Total Files</div>
          <div className="text-xl font-bold mt-1 text-zinc-900 dark:text-zinc-100">{files.length}</div>
        </Card>
        <Card className="p-3">
          <div className="text-[10px] text-zinc-500 font-medium flex items-center gap-1">
            <HardDrive className="w-3 h-3 text-indigo-500" />
            Storage Used
          </div>
          <div className="text-xl font-bold mt-1 text-zinc-900 dark:text-zinc-100 font-mono">
            {formatBytes(totalBytes)}
          </div>
        </Card>
        <Card className="p-3">
          <div className="text-[10px] text-zinc-500 font-medium">Storage Location</div>
          <div className="text-xs font-mono mt-1 text-zinc-600 dark:text-zinc-400 truncate">
            ./data/uploads (Private)
          </div>
        </Card>
      </div>

      {/* Files Table */}
      {files.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg space-y-2">
          <Paperclip className="w-8 h-8 text-zinc-400 mx-auto" />
          <h3 className="text-xs font-semibold">No file attachments stored</h3>
          <p className="text-[11px] text-zinc-500">
            Upload reference Markdown, PDF, or text files to associate with your prompts.
          </p>
        </div>
      ) : (
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden bg-white dark:bg-zinc-900/60 shadow-2xs divide-y divide-zinc-200 dark:divide-zinc-800">
          <div className="flex items-center px-4 py-2 bg-zinc-50 dark:bg-zinc-950 text-[11px] font-semibold text-zinc-500">
            <div className="flex-1">Filename</div>
            <div className="hidden sm:block w-48 px-2">Associated Entity</div>
            <div className="w-24 px-2 text-right">Size</div>
            <div className="hidden md:block w-32 px-2 text-right">Added</div>
            <div className="w-20 text-right">Actions</div>
          </div>

          {files.map((f) => (
            <div
              key={f.id}
              className="flex items-center px-4 py-2.5 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
            >
              <div className="flex-1 flex items-center gap-2 truncate pr-2">
                {f.originalName.endsWith(".zip") ? (
                  <FileArchive className="w-4 h-4 text-amber-500 shrink-0" />
                ) : f.originalName.endsWith(".json") ? (
                  <FileCode className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                )}
                <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                  {f.originalName}
                </span>
              </div>

              <div className="hidden sm:flex flex-col w-48 px-2 truncate text-[11px]">
                {f.prompt && (
                  <Link
                    href={`/prompts/${f.prompt.id}`}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline truncate"
                  >
                    Prompt: {f.prompt.title}
                  </Link>
                )}
                {f.workspace && (
                  <Link
                    href={`/workspaces/${f.workspace.id}`}
                    className="text-zinc-500 hover:underline truncate"
                  >
                    Workspace: {f.workspace.name}
                  </Link>
                )}
                {!f.prompt && !f.workspace && <span className="text-zinc-400 italic">Unassigned</span>}
              </div>

              <div className="w-24 px-2 text-right font-mono text-[11px] text-zinc-500">
                {formatBytes(f.fileSize)}
              </div>

              <div className="hidden md:block w-32 px-2 text-right font-mono text-[10px] text-zinc-400">
                {formatDate(f.createdAt)}
              </div>

              <div className="w-20 flex items-center justify-end gap-1">
                <Button asChild size="iconSm" variant="ghost" title="Download">
                  <a href={`/api/attachments/${f.id}/download`} download>
                    <Download className="w-3.5 h-3.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100" />
                  </a>
                </Button>
                <Button
                  size="iconSm"
                  variant="ghost"
                  onClick={() => handleDelete(f.id, f.originalName)}
                  className="hover:text-red-500"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5 text-zinc-400 hover:text-red-500" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
