"use client";

import React, { useState, useTransition } from "react";
import {
  HardDrive,
  Database,
  Upload,
  AlertTriangle,
  Trash2,
  RefreshCw,
  CheckCircle2,
  FileText,
  Copy,
  Layers,
  FolderOpen,
  Tag,
  Boxes,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { formatBytes } from "@/lib/utils";
import {
  getStorageStatsAction,
  parseImportFileAction,
  executeImportAction,
  type StorageStats,
} from "@/features/backup/actions";
import { clearSelectedDataAction } from "@/features/settings/actions";
import type { ParsedImportItem } from "@/lib/backup/import-export";

interface Props {
  initialStats: StorageStats;
  folders: { id: string; name: string }[];
  categories: { id: string; name: string }[];
  workspaces: { id: string; name: string }[];
}

export function StorageSettingsView({ initialStats, folders, categories, workspaces }: Props) {
  const [stats, setStats] = useState<StorageStats>(initialStats);
  const [isRefreshing, startRefresh] = useTransition();

  // Import state
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, startImport] = useTransition();
  const [parsedItems, setParsedItems] = useState<ParsedImportItem[]>([]);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [destinationFolder, setDestinationFolder] = useState<string>("");
  const [destinationCategory, setDestinationCategory] = useState<string>("");
  const [destinationWorkspace, setDestinationWorkspace] = useState<string>("");

  // Clearance state
  const [clearanceTarget, setClearanceTarget] = useState<"trash" | "ai" | "logs" | "all_prompts" | null>(null);
  const [confirmInput, setConfirmInput] = useState("");
  const [isClearing, startClear] = useTransition();

  const handleRefreshStats = () => {
    startRefresh(async () => {
      const res = await getStorageStatsAction();
      if (res.success && res.stats) {
        setStats(res.stats);
        toast.success("Storage statistics refreshed");
      } else {
        toast.error(res.error || "Failed to refresh storage statistics");
      }
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    setIsParsing(true);
    try {
      const content = await file.text();
      const res = await parseImportFileAction(content, file.name);
      if (res.success && res.items) {
        setParsedItems(res.items);
        toast.success(`Parsed ${res.items.length} prompts from ${file.name}`);
      } else {
        toast.error(res.error || "Failed to parse import file");
        setParsedItems([]);
      }
    } catch (err: any) {
      toast.error(err.message || "Error reading file");
    } finally {
      setIsParsing(false);
    }
  };

  const handleExecuteImport = () => {
    if (parsedItems.length === 0) return;

    startImport(async () => {
      const res = await executeImportAction(parsedItems, {
        folderId: destinationFolder || undefined,
        categoryId: destinationCategory || undefined,
        workspaceId: destinationWorkspace || undefined,
      });

      if (res.success) {
        toast.success(`Successfully imported ${res.importedCount} prompts!`);
        setParsedItems([]);
        setSelectedFileName(null);
        handleRefreshStats();
      } else {
        toast.error("Import failed: " + res.errors.join(", "));
      }
    });
  };

  const handleClearanceConfirm = () => {
    if (!clearanceTarget) return;

    if (clearanceTarget === "all_prompts" && confirmInput !== "DELETE ALL PROMPTS") {
      toast.error("You must type 'DELETE ALL PROMPTS' exactly to confirm");
      return;
    }

    startClear(async () => {
      const options = {
        clearTrash: clearanceTarget === "trash",
        clearAiHistory: clearanceTarget === "ai",
        clearActivityLogs: clearanceTarget === "logs",
        clearPrompts: clearanceTarget === "all_prompts",
      };

      const res = await clearSelectedDataAction(options);
      if (res.success) {
        toast.success(res.message);
        setClearanceTarget(null);
        setConfirmInput("");
        handleRefreshStats();
      } else {
        toast.error("Failed to clear data");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Storage & Database Overview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-emerald-500" />
              Storage & Disk Footprint
            </CardTitle>
            <CardDescription className="text-xs">
              Physical storage footprint on disk and SQLite database volume.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshStats}
            disabled={isRefreshing}
            className="h-8 gap-1 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-zinc-50 dark:bg-zinc-900/60 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <span className="text-[11px] font-medium text-zinc-500 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-blue-500" /> SQLite Database
              </span>
              <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                {formatBytes(stats.databaseSizeBytes)}
              </p>
              <span className="text-[10px] text-zinc-400">WAL mode persistent storage</span>
            </div>

            <div className="p-3 bg-zinc-50 dark:bg-zinc-900/60 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <span className="text-[11px] font-medium text-zinc-500 flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-purple-500" /> Attached Files
              </span>
              <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                {formatBytes(stats.uploadsSizeBytes)}
              </p>
              <span className="text-[10px] text-zinc-400">{stats.counts.attachments} files in ./data/uploads</span>
            </div>

            <div className="p-3 bg-zinc-50 dark:bg-zinc-900/60 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <span className="text-[11px] font-medium text-zinc-500 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-500" /> Total Prompts
              </span>
              <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                {stats.counts.prompts}
              </p>
              <span className="text-[10px] text-zinc-400">
                {stats.counts.activePrompts} active · {stats.counts.trashedPrompts} in trash
              </span>
            </div>

            <div className="p-3 bg-zinc-50 dark:bg-zinc-900/60 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <span className="text-[11px] font-medium text-zinc-500 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-500" /> Total Snapshots
              </span>
              <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                {stats.counts.versions}
              </p>
              <span className="text-[10px] text-zinc-400">Immutable version revisions</span>
            </div>
          </div>

          {/* Record Counts Grid */}
          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <h4 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Entity Count Breakdown</h4>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
              <div className="p-2 rounded bg-zinc-100/50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <span className="text-[10px] text-zinc-500 block">Folders</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">{stats.counts.folders}</span>
              </div>
              <div className="p-2 rounded bg-zinc-100/50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <span className="text-[10px] text-zinc-500 block">Categories</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">{stats.counts.categories}</span>
              </div>
              <div className="p-2 rounded bg-zinc-100/50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <span className="text-[10px] text-zinc-500 block">Tags</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">{stats.counts.tags}</span>
              </div>
              <div className="p-2 rounded bg-zinc-100/50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <span className="text-[10px] text-zinc-500 block">Workspaces</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">{stats.counts.workspaces}</span>
              </div>
              <div className="p-2 rounded bg-zinc-100/50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <span className="text-[10px] text-zinc-500 block">Templates</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">{stats.counts.templates}</span>
              </div>
              <div className="p-2 rounded bg-zinc-100/50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <span className="text-[10px] text-zinc-500 block">Audit Logs</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">{stats.counts.activityLogs}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. File Import Tool */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Upload className="w-4 h-4 text-blue-500" />
            Import Prompts (JSON or Markdown)
          </CardTitle>
          <CardDescription className="text-xs">
            Import prompts in bulk from JSON arrays or Markdown files. Duplicate titles will be flagged for review.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg p-6 text-center hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
            <input
              type="file"
              id="file-import-input"
              accept=".json,.md,.txt"
              className="hidden"
              onChange={handleFileChange}
              disabled={isParsing || isImporting}
            />
            <label
              htmlFor="file-import-input"
              className="cursor-pointer flex flex-col items-center justify-center gap-2"
            >
              <Upload className="w-8 h-8 text-zinc-400" />
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {selectedFileName ? selectedFileName : "Choose a JSON or Markdown file"}
              </span>
              <span className="text-xs text-zinc-500">Supports .json, .md, .txt up to 25MB</span>
            </label>
          </div>

          {/* Parsed Items Preview */}
          {parsedItems.length > 0 && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Detected Prompts ({parsedItems.length})
                </span>
                <Badge variant="outline" className="text-xs">
                  {parsedItems.filter((i) => i.isDuplicate).length} duplicates flagged
                </Badge>
              </div>

              {/* Assignment Selectors */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <div>
                  <Label className="text-[11px] text-zinc-500 mb-1 block">Destination Folder (Optional)</Label>
                  <Select value={destinationFolder} onValueChange={setDestinationFolder}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="No Folder" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No Folder</SelectItem>
                      {folders.map((f) => (
                        <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-[11px] text-zinc-500 mb-1 block">Destination Category (Optional)</Label>
                  <Select value={destinationCategory} onValueChange={setDestinationCategory}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="No Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No Category</SelectItem>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-[11px] text-zinc-500 mb-1 block">Destination Workspace (Optional)</Label>
                  <Select value={destinationWorkspace} onValueChange={setDestinationWorkspace}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Global (No Workspace)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Global (No Workspace)</SelectItem>
                      {workspaces.map((w) => (
                        <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Preview List */}
              <div className="max-h-60 overflow-y-auto space-y-2 border border-zinc-200 dark:border-zinc-800 rounded-md p-2">
                {parsedItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                          {item.title}
                        </span>
                        {item.isDuplicate && (
                          <Badge variant="destructive" className="text-[10px] py-0 px-1.5 h-4">
                            Duplicate Title
                          </Badge>
                        )}
                      </div>
                      <p className="text-zinc-500 text-[11px] line-clamp-1">{item.content}</p>
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {item.tags.map((t, tidx) => (
                            <span
                              key={tidx}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Execute Import Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setParsedItems([]);
                    setSelectedFileName(null);
                  }}
                  className="h-8 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleExecuteImport}
                  disabled={isImporting}
                  className="h-8 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {isImporting ? "Importing..." : `Import ${parsedItems.length} Prompts`}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3. Selective Data Clearance (Danger Zone) */}
      <Card className="border-red-200 dark:border-red-950/50">
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertTriangle className="w-4 h-4" />
            Selective Data Clearance
          </CardTitle>
          <CardDescription className="text-xs">
            Selectively purge soft-deleted items, playground history, or audit logs to free database storage.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <div>
              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Empty Trash</p>
              <p className="text-[11px] text-zinc-500">
                Permanently deletes all {stats.counts.trashedPrompts} prompts currently in trash.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={stats.counts.trashedPrompts === 0}
              onClick={() => setClearanceTarget("trash")}
              className="text-xs h-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
            >
              Empty Trash
            </Button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <div>
              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Clear AI Playground History</p>
              <p className="text-[11px] text-zinc-500">
                Deletes all {stats.counts.aiTestResults} test execution logs and cost metrics.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={stats.counts.aiTestResults === 0}
              onClick={() => setClearanceTarget("ai")}
              className="text-xs h-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
            >
              Clear AI Tests
            </Button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <div>
              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Clear Audit Logs</p>
              <p className="text-[11px] text-zinc-500">
                Purges all {stats.counts.activityLogs} historical activity audit records.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={stats.counts.activityLogs === 0}
              onClick={() => setClearanceTarget("logs")}
              className="text-xs h-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
            >
              Clear Logs
            </Button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/10">
            <div>
              <p className="text-xs font-semibold text-red-700 dark:text-red-300">Purge All Prompts</p>
              <p className="text-[11px] text-zinc-500">
                Permanently wipes all {stats.counts.prompts} prompts and all snapshots. Requires confirmation.
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              disabled={stats.counts.prompts === 0}
              onClick={() => {
                setConfirmInput("");
                setClearanceTarget("all_prompts");
              }}
              className="text-xs h-8"
            >
              Purge All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!clearanceTarget} onOpenChange={(open) => !open && setClearanceTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-semibold flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-4 h-4" />
              {clearanceTarget === "all_prompts"
                ? "Irreversible Action: Purge All Prompts"
                : "Confirm Data Clearance"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs space-y-2">
              {clearanceTarget === "trash" && "Are you sure you want to permanently delete all items in trash?"}
              {clearanceTarget === "ai" && "Are you sure you want to delete all AI playground execution records?"}
              {clearanceTarget === "logs" && "Are you sure you want to delete all activity audit logs?"}
              {clearanceTarget === "all_prompts" && (
                <>
                  <span>
                    This will permanently delete ALL prompts, versions, and tags in your database. This action CANNOT
                    be undone.
                  </span>
                  <div className="pt-2">
                    <Label className="text-xs text-zinc-700 dark:text-zinc-300">
                      Type <strong>DELETE ALL PROMPTS</strong> to confirm:
                    </Label>
                    <Input
                      value={confirmInput}
                      onChange={(e) => setConfirmInput(e.target.value)}
                      placeholder="DELETE ALL PROMPTS"
                      className="mt-1 text-xs"
                    />
                  </div>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs h-8">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearanceConfirm}
              disabled={isClearing || (clearanceTarget === "all_prompts" && confirmInput !== "DELETE ALL PROMPTS")}
              className="text-xs h-8 bg-red-600 hover:bg-red-700 text-white"
            >
              {isClearing ? "Purging..." : "Confirm & Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
