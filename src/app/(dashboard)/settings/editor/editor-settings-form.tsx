"use client";

import React, { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sliders, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { updateAppSettingsAction } from "@/features/settings/actions";

export function EditorSettingsForm({
  settings,
}: {
  settings: {
    editorFontSize: number;
    autosaveInterval: number;
    defaultEditorMode: string;
    markdownPreviewTheme: string;
  };
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [fontSize, setFontSize] = React.useState(settings.editorFontSize || 14);
  const [autosaveInterval, setAutosaveInterval] = React.useState(settings.autosaveInterval || 1000);
  const [defaultMode, setDefaultMode] = React.useState(settings.defaultEditorMode || "split");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await updateAppSettingsAction({
        editorFontSize: fontSize,
        autosaveInterval,
        defaultEditorMode: defaultMode,
      });

      if (res.success) {
        toast.success("Editor preferences updated");
        router.refresh();
      } else {
        toast.error(res.error || "Failed to update preferences");
      }
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-xs font-semibold flex items-center gap-2">
          <Sliders className="w-4 h-4 text-indigo-500" />
          CodeMirror Prompt Editor Configuration
        </CardTitle>
        <CardDescription className="text-[11px]">
          Configure default view splits, typography, and autosave intervals.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4 max-w-md text-xs">
          <div className="space-y-1">
            <Label htmlFor="ed-font">Default Editor Font Size: {fontSize}px</Label>
            <input
              id="ed-font"
              type="range"
              min="11"
              max="18"
              step="1"
              value={fontSize}
              onChange={(e) => setFontSize(parseInt(e.target.value) || 14)}
              className="w-full mt-1.5"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="ed-mode">Default Screen Layout Mode</Label>
            <select
              id="ed-mode"
              value={defaultMode}
              onChange={(e) => setDefaultMode(e.target.value)}
              className="w-full h-8 px-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs"
            >
              <option value="split">Split View (Editor + Live Preview)</option>
              <option value="editor">Editor Only</option>
              <option value="preview">Preview Only</option>
            </select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="ed-autosave">Debounced Autosave Interval</Label>
            <select
              id="ed-autosave"
              value={autosaveInterval}
              onChange={(e) => setAutosaveInterval(parseInt(e.target.value) || 1000)}
              className="w-full h-8 px-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs"
            >
              <option value={1000}>1 second</option>
              <option value={2000}>2 seconds (Recommended)</option>
              <option value={5000}>5 seconds</option>
            </select>
          </div>

          <Button type="submit" size="sm" disabled={isPending} className="gap-1.5 font-semibold">
            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save Editor Preferences
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
