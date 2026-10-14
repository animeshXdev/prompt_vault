"use client";

import React, { useState, useTransition } from "react";
import {
  Download,
  Upload,
  Database,
  Archive,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  FileArchive,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { formatDate } from "@/lib/utils";

interface BackupHistoryItem {
  id: string;
  action: string;
  createdAt: Date | string;
  detailsJson?: string | null;
}

interface Props {
  recentBackups: BackupHistoryItem[];
  recordCounts: {
    prompts: number;
    versions: number;
    attachments: number;
    workspaces: number;
    templates: number;
    masterPrompts: number;
  };
}

export function BackupSettingsView({ recentBackups, recordCounts }: Props) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isRestoring, setIsRestoring] = useState(false);

  const handleDownloadBackup = async () => {
    try {
      setIsDownloading(true);
      toast.info("Generating full vault backup archive...");
      // Trigger download via direct window navigation or temporary anchor
      const link = document.createElement("a");
      link.href = "/api/backup/download";
      link.download = "";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Backup archive download started");
    } catch (err: any) {
      toast.error("Failed to trigger backup download");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".zip")) {
      toast.error("Please upload a valid .zip backup archive");
      return;
    }

    setSelectedFile(file);
    setShowRestoreModal(true);
  };

  const handleConfirmRestore = async () => {
    if (!selectedFile) return;

    if (confirmText !== "RESTORE VAULT") {
      toast.error("You must type 'RESTORE VAULT' exactly to confirm");
      return;
    }

    try {
      setIsRestoring(true);
      toast.info("Restoring backup archive, please wait...");

      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/backup/restore", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to restore backup");
      }

      toast.success("Backup successfully restored! Reloading...");
      setShowRestoreModal(false);
      setSelectedFile(null);
      setConfirmText("");

      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1500);
    } catch (err: any) {
      toast.error(err.message || "Failed to restore backup");
      setIsRestoring(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Full Vault Backup */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Archive className="w-4 h-4 text-emerald-500" />
            Complete Vault Backup
          </CardTitle>
          <CardDescription className="text-xs">
            Download a portable, standalone ZIP archive containing all your prompts, version history, templates,
            rules, workspaces, and uploaded reference attachments.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 bg-zinc-50 dark:bg-zinc-900/60 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs space-y-2">
            <span className="font-semibold text-zinc-900 dark:text-zinc-100 block">
              What is included in this backup:
            </span>
            <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-zinc-600 dark:text-zinc-400">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>{recordCounts.prompts} Prompts & Content</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>{recordCounts.versions} Version Snapshots</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>{recordCounts.workspaces} Workspaces & Rules</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>{recordCounts.templates} Templates & Presets</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>{recordCounts.masterPrompts} Master Instructions</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>{recordCounts.attachments} Binary File Attachments</span>
              </li>
            </ul>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="text-xs text-zinc-500">
              Backups are standard ZIP files with a JSON manifest and raw attachments.
            </div>
            <Button
              onClick={handleDownloadBackup}
              disabled={isDownloading}
              className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Download className={`w-3.5 h-3.5 ${isDownloading ? "animate-bounce" : ""}`} />
              {isDownloading ? "Generating ZIP..." : "Download Backup Archive (.zip)"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 2. Restore Vault Archive */}
      <Card className="border-amber-200 dark:border-amber-950/50">
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-amber-700 dark:text-amber-400">
            <Upload className="w-4 h-4" />
            Restore Vault from Archive
          </CardTitle>
          <CardDescription className="text-xs">
            Restore your entire application state from a previously generated PromptVault ZIP archive.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-amber-200 dark:border-amber-900/40 rounded-lg p-6 text-center hover:bg-amber-50/50 dark:hover:bg-amber-950/10 transition-colors">
            <input
              type="file"
              id="restore-file-input"
              accept=".zip"
              className="hidden"
              onChange={handleFileChange}
              disabled={isRestoring}
            />
            <label
              htmlFor="restore-file-input"
              className="cursor-pointer flex flex-col items-center justify-center gap-2"
            >
              <FileArchive className="w-8 h-8 text-amber-500" />
              <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                {selectedFile ? selectedFile.name : "Select PromptVault Backup Archive (.zip)"}
              </span>
              <span className="text-xs text-zinc-500">
                Requires a valid promptvault-backup archive with manifest.json
              </span>
            </label>
          </div>

          <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-md border border-amber-200 dark:border-amber-900/30 text-xs text-amber-800 dark:text-amber-300">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <span>
              Restoring an archive will merge entities and unpack attachments. Ensure you have created a fresh
              backup of your current vault before restoring.
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 3. Recent Backup & Restore Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-500" />
            Backup & Restore History
          </CardTitle>
          <CardDescription className="text-xs">
            Recent backup creation and restoration events recorded in the system audit log.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentBackups.length === 0 ? (
            <p className="text-xs text-zinc-400 py-4 text-center">No backup or restore activity recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {recentBackups.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2.5 rounded border border-zinc-200 dark:border-zinc-800 text-xs"
                >
                  <div className="flex items-center gap-2">
                    {item.action === "backup_created" ? (
                      <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-300">
                        Backup Created
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] text-blue-600 border-blue-300">
                        Vault Restored
                      </Badge>
                    )}
                    <span className="text-zinc-600 dark:text-zinc-400">
                      {item.action === "backup_created"
                        ? "Full ZIP archive generated"
                        : "Data successfully restored"}
                    </span>
                  </div>
                  <span className="text-zinc-400 text-[11px]">{formatDate(item.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Modal for Restore */}
      <AlertDialog open={showRestoreModal} onOpenChange={setShowRestoreModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-semibold flex items-center gap-2 text-amber-600">
              <AlertTriangle className="w-4 h-4" />
              Confirm Vault Restoration
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs space-y-2">
              <p>
                You are about to restore PromptVault from <strong>{selectedFile?.name}</strong>.
              </p>
              <p>
                This operation will parse the backup manifest, reconstruct database records, and overwrite local
                attachments.
              </p>
              <div className="pt-2">
                <Label className="text-xs text-zinc-700 dark:text-zinc-300">
                  Type <strong>RESTORE VAULT</strong> to proceed:
                </Label>
                <Input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="RESTORE VAULT"
                  className="mt-1 text-xs"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setSelectedFile(null);
                setConfirmText("");
              }}
              className="text-xs h-8"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRestore}
              disabled={isRestoring || confirmText !== "RESTORE VAULT"}
              className="text-xs h-8 bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isRestoring ? (
                <span className="flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Restoring...
                </span>
              ) : (
                "Execute Restoration"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
