"use client";

import React, { useState } from "react";
import { computeLineDiff, type LineDiff } from "@/lib/diff";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { History, RotateCcw, Columns2, AlignJustify, ArrowLeftRight } from "lucide-react";
import { restorePromptVersionAction } from "@/features/prompts/actions";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export interface VersionItem {
  id: string;
  versionNumber: number;
  title: string;
  content: string;
  notes?: string | null;
  changeNotes?: string | null;
  isStable: boolean;
  createdAt: Date | string;
}

interface VersionDiffViewerProps {
  promptId: string;
  currentContent: string;
  versions: VersionItem[];
  onRestored?: () => void;
}

export function VersionDiffViewer({
  promptId,
  currentContent,
  versions,
  onRestored,
}: VersionDiffViewerProps) {
  const [selectedVersionId, setSelectedVersionId] = useState<string>(
    versions[0]?.id || ""
  );
  const [diffMode, setDiffMode] = useState<"split" | "unified">("unified");
  const [isRestoring, setIsRestoring] = useState(false);

  const selectedVersion = versions.find((v) => v.id === selectedVersionId) || versions[0];
  const oldText = selectedVersion?.content || "";
  const newText = currentContent;

  const diffLines = computeLineDiff(oldText, newText);

  const handleRestore = async () => {
    if (!selectedVersion) return;
    setIsRestoring(true);
    try {
      const res = await restorePromptVersionAction(promptId, selectedVersion.id);
      if (res.success) {
        toast.success(`Restored revision v${selectedVersion.versionNumber} as new version`);
        if (onRestored) onRestored();
      } else {
        toast.error(res.error || "Failed to restore version");
      }
    } catch {
      toast.error("Failed to restore version");
    } finally {
      setIsRestoring(false);
    }
  };

  if (!versions || versions.length === 0) {
    return (
      <div className="p-8 text-center text-zinc-500 text-xs italic">
        No version history recorded yet. Snapshots will appear here as you save edits.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Version Selector Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-lg">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-indigo-500" />
          <span className="text-xs font-semibold">Comparing:</span>
          <select
            value={selectedVersionId}
            onChange={(e) => setSelectedVersionId(e.target.value)}
            className="text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1 font-mono"
          >
            {versions.map((v) => (
              <option key={v.id} value={v.id}>
                v{v.versionNumber} ({formatDate(v.createdAt)}) — {v.changeNotes || "Snapshot"}
              </option>
            ))}
          </select>
          <span className="text-xs text-zinc-400">vs Current Live</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-md p-0.5 bg-zinc-200/60 dark:bg-zinc-800">
            <button
              type="button"
              onClick={() => setDiffMode("unified")}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
                diffMode === "unified"
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              <AlignJustify className="w-3 h-3" />
              Unified
            </button>
            <button
              type="button"
              onClick={() => setDiffMode("split")}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
                diffMode === "split"
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              <Columns2 className="w-3 h-3" />
              Side-by-Side
            </button>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1.5" disabled={isRestoring}>
                <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
                Restore v{selectedVersion?.versionNumber}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Restore Historical Version?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will create a new current revision with the content from version v
                  {selectedVersion?.versionNumber}. Historical versions are never erased.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleRestore}>Confirm Restore</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Version Metadata Summary */}
      {selectedVersion && (
        <div className="flex items-center gap-3 text-xs text-zinc-500 px-1">
          <span>
            Milestone: <strong className="text-zinc-900 dark:text-zinc-100">v{selectedVersion.versionNumber}</strong>
          </span>
          <span>•</span>
          <span>Created: {formatDate(selectedVersion.createdAt)}</span>
          {selectedVersion.changeNotes && (
            <>
              <span>•</span>
              <span className="italic">"{selectedVersion.changeNotes}"</span>
            </>
          )}
          {selectedVersion.isStable && (
            <Badge variant="success" className="ml-2">
              Marked Stable
            </Badge>
          )}
        </div>
      )}

      {/* Diff Output Container */}
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden font-mono text-[11.5px] bg-zinc-900 text-zinc-100">
        {diffMode === "unified" ? (
          <div className="divide-y divide-zinc-800/60 overflow-x-auto">
            {diffLines.map((line, idx) => (
              <div
                key={idx}
                className={`flex items-start px-3 py-1 font-mono leading-relaxed ${
                  line.type === "added"
                    ? "bg-emerald-950/40 text-emerald-300"
                    : line.type === "removed"
                    ? "bg-rose-950/40 text-rose-300 line-through opacity-80"
                    : "text-zinc-300 hover:bg-zinc-800/30"
                }`}
              >
                <span className="w-10 shrink-0 text-right pr-3 select-none text-zinc-600 font-mono text-[10px]">
                  {line.lineNumberOld || ""}
                </span>
                <span className="w-10 shrink-0 text-right pr-3 select-none text-zinc-600 font-mono text-[10px]">
                  {line.lineNumberNew || ""}
                </span>
                <span className="w-4 shrink-0 select-none font-bold">
                  {line.type === "added" ? "+" : line.type === "removed" ? "-" : " "}
                </span>
                <span className="flex-1 whitespace-pre-wrap break-all">{line.content}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 divide-x divide-zinc-800 overflow-x-auto">
            {/* Left: Old Version */}
            <div className="p-3">
              <div className="text-[10px] text-zinc-400 font-sans uppercase font-bold tracking-wider mb-2 pb-1 border-b border-zinc-800">
                v{selectedVersion?.versionNumber} (Historical)
              </div>
              <pre className="whitespace-pre-wrap font-mono text-zinc-300 leading-relaxed">
                {oldText}
              </pre>
            </div>
            {/* Right: Current Live */}
            <div className="p-3">
              <div className="text-[10px] text-zinc-400 font-sans uppercase font-bold tracking-wider mb-2 pb-1 border-b border-zinc-800">
                Current Live Version
              </div>
              <pre className="whitespace-pre-wrap font-mono text-zinc-300 leading-relaxed">
                {newText}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
