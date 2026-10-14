"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Upload, Paperclip, Download, Trash2, Eye, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { uploadAttachmentAction, deleteAttachmentAction } from "@/features/attachments/actions";
import { formatBytes, formatDate } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface AttachmentItem {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  createdAt: Date | string;
}

export function PromptAttachmentsTab({
  promptId,
  attachments = [],
}: {
  promptId?: string;
  attachments: AttachmentItem[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [previewContent, setPreviewContent] = useState<{ name: string; text?: string } | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    if (promptId) formData.append("promptId", promptId);

    startTransition(async () => {
      const res = await uploadAttachmentAction(formData);
      if (res.success) {
        toast.success(`Attached "${file.name}" successfully`);
        router.refresh();
      } else {
        toast.error(res.error || "Failed to upload attachment");
      }
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const res = await deleteAttachmentAction(id);
      if (res.success) {
        toast.success("Attachment deleted");
        router.refresh();
      } else {
        toast.error(res.error || "Failed to delete attachment");
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Upload Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-lg">
        <div>
          <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
            <Paperclip className="w-3.5 h-3.5 text-indigo-500" />
            File Attachments & Context Documents
          </h3>
          <p className="text-[11px] text-zinc-400">
            Supported formats: TXT, Markdown, JSON, PDF, ZIP (Max 25MB). Stored securely on private disk.
          </p>
        </div>

        <label className="cursor-pointer">
          <input
            type="file"
            onChange={handleFileUpload}
            disabled={isPending}
            className="hidden"
            accept=".txt,.md,.json,.pdf,.zip"
          />
          <Button asChild size="sm" variant="outline" className="gap-1.5 cursor-pointer" disabled={isPending}>
            <span>
              {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              Upload Attachment
            </span>
          </Button>
        </label>
      </div>

      {/* Attachments List */}
      {attachments.length === 0 ? (
        <div className="p-8 text-center text-xs text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg italic">
          No files attached to this prompt yet.
        </div>
      ) : (
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden divide-y divide-zinc-200 dark:divide-zinc-800">
          {attachments.map((att) => (
            <div key={att.id} className="flex items-center justify-between p-3 text-xs bg-white dark:bg-zinc-900/40 hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-colors">
              <div className="flex items-center gap-2.5 truncate">
                <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                <div className="truncate">
                  <p className="font-medium text-zinc-900 dark:text-zinc-100 truncate">{att.originalName}</p>
                  <p className="text-[10px] text-zinc-400 font-mono">
                    {formatBytes(att.fileSize)} • Added {formatDate(att.createdAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Button asChild size="iconSm" variant="ghost" title="Download file">
                  <a href={`/api/attachments/${att.id}/download`} download>
                    <Download className="w-3.5 h-3.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100" />
                  </a>
                </Button>
                <Button
                  size="iconSm"
                  variant="ghost"
                  onClick={() => handleDelete(att.id)}
                  title="Delete file"
                  className="hover:text-red-500"
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
