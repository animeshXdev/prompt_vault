"use client";

import React, { useState, useEffect, useRef, useTransition, useCallback } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { markdown } from "@codemirror/lang-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import {
  Columns2,
  FileText,
  Eye,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Sparkles,
  BookmarkPlus,
  Undo2,
  Redo2,
  Save,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { estimateTokenCount, getWordCount, getCharCount } from "@/lib/utils";
import { optimizePromptWithAIAction } from "@/features/ai/actions";

interface PromptEditorProps {
  initialContent: string;
  initialTitle?: string;
  onSave?: (content: string, title?: string, changeNotes?: string) => Promise<any>;
  onCopy?: () => void;
  readOnly?: boolean;
  defaultMode?: "split" | "editor" | "preview";
  fontSize?: number;
  showAiTools?: boolean;
}

export function PromptEditor({
  initialContent,
  initialTitle = "",
  onSave,
  onCopy,
  readOnly = false,
  defaultMode = "split",
  fontSize = 14,
  showAiTools = true,
}: PromptEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [title, setTitle] = useState(initialTitle);
  const [mode, setMode] = useState<"split" | "editor" | "preview">(defaultMode);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "unsaved" | "saving">("saved");
  const [editorFontSize, setEditorFontSize] = useState(fontSize);

  // Snapshot modal
  const [snapshotOpen, setSnapshotOpen] = useState(false);
  const [changeNotes, setChangeNotes] = useState("");

  // AI assistant modal
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiMode, setAiMode] = useState<"clarity" | "structure" | "grammar" | "critique">("clarity");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync state if initialContent changes externally
  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  // Unsaved changes protection
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (saveStatus === "unsaved") {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [saveStatus]);

  // Debounced autosave
  const triggerAutoSave = useCallback(
    (newContent: string) => {
      if (readOnly || !onSave) return;
      setSaveStatus("unsaved");

      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }

      autosaveTimerRef.current = setTimeout(() => {
        setSaveStatus("saving");
        startTransition(async () => {
          try {
            await onSave(newContent, title);
            setSaveStatus("saved");
          } catch (err) {
            setSaveStatus("unsaved");
          }
        });
      }, 2000);
    },
    [onSave, readOnly, title]
  );

  const handleContentChange = (val: string) => {
    setContent(val);
    triggerAutoSave(val);
  };

  const handleManualSave = async () => {
    if (!onSave) return;
    setSaveStatus("saving");
    try {
      await onSave(content, title);
      setSaveStatus("saved");
      toast.success("Changes saved successfully");
    } catch {
      setSaveStatus("unsaved");
      toast.error("Failed to save changes");
    }
  };

  const handleCreateSnapshot = async () => {
    if (!onSave) return;
    setSaveStatus("saving");
    try {
      await onSave(content, title, changeNotes || "Manual snapshot");
      setSaveStatus("saved");
      setSnapshotOpen(false);
      setChangeNotes("");
      toast.success("Version snapshot created");
    } catch {
      toast.error("Failed to create snapshot");
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast.success("Prompt copied to clipboard");
      if (onCopy) onCopy();
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not access clipboard");
    }
  };

  const handleRunAiOptimization = async () => {
    if (!content.trim()) {
      toast.error("Prompt content is empty");
      return;
    }
    setAiLoading(true);
    setAiResult(null);
    try {
      const res = await optimizePromptWithAIAction(content, aiMode);
      if (res.success && res.content) {
        setAiResult(res.content);
      } else {
        toast.error(res.error || "AI provider returned an error");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to execute AI request");
    } finally {
      setAiLoading(false);
    }
  };

  const applyAiResult = () => {
    if (aiResult) {
      setContent(aiResult);
      triggerAutoSave(aiResult);
      setAiModalOpen(false);
      toast.success("AI suggestion applied to editor");
    }
  };

  const wordCount = getWordCount(content);
  const charCount = getCharCount(content);
  const tokenCount = estimateTokenCount(content);

  return (
    <div
      ref={containerRef}
      className={`flex flex-col border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden bg-white dark:bg-zinc-950 transition-all ${
        isFullscreen
          ? "fixed inset-0 z-50 rounded-none border-none bg-white dark:bg-zinc-950"
          : "h-full min-h-[500px]"
      }`}
    >
      {/* Editor Toolbar */}
      <div className="flex flex-wrap items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-3 py-1.5 bg-zinc-50/70 dark:bg-zinc-900/50 gap-2 select-none">
        {/* Left: View Mode Toggles */}
        <div className="flex items-center gap-1">
          <div className="inline-flex rounded-md p-0.5 bg-zinc-200/60 dark:bg-zinc-800">
            <button
              type="button"
              onClick={() => setMode("editor")}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
                mode === "editor"
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
              title="Editor Only"
            >
              <FileText className="w-3 h-3" />
              Editor
            </button>
            <button
              type="button"
              onClick={() => setMode("split")}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
                mode === "split"
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
              title="Split View"
            >
              <Columns2 className="w-3 h-3" />
              Split
            </button>
            <button
              type="button"
              onClick={() => setMode("preview")}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
                mode === "preview"
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
              title="Preview Only"
            >
              <Eye className="w-3 h-3" />
              Preview
            </button>
          </div>

          {/* Font Size Selector */}
          <div className="hidden sm:flex items-center gap-1 ml-2 text-[11px] text-zinc-500">
            <span>Size:</span>
            {[12, 14, 16].map((sz) => (
              <button
                key={sz}
                type="button"
                onClick={() => setEditorFontSize(sz)}
                className={`px-1.5 py-0.5 rounded text-[10px] ${
                  editorFontSize === sz
                    ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold"
                    : "hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500"
                }`}
              >
                {sz}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Metrics & Actions */}
        <div className="flex items-center gap-2">
          {/* Metrics Badges */}
          <div className="hidden md:flex items-center gap-1.5 text-[11px]">
            <span className="text-zinc-400">Tokens:</span>
            <Badge variant="secondary" className="font-mono text-[10px]">
              ~{tokenCount}
            </Badge>
            <span className="text-zinc-400 ml-1">Words:</span>
            <span className="text-zinc-600 dark:text-zinc-400 font-mono text-[10px]">{wordCount}</span>
            <span className="text-zinc-400 ml-1">Chars:</span>
            <span className="text-zinc-600 dark:text-zinc-400 font-mono text-[10px]">{charCount}</span>
          </div>

          {/* Save Status Indicator */}
          {!readOnly && (
            <div className="flex items-center gap-1 text-[11px] px-1 text-zinc-400">
              {saveStatus === "saving" && (
                <>
                  <Loader2 className="w-3 h-3 animate-spin text-indigo-500" />
                  <span>Saving...</span>
                </>
              )}
              {saveStatus === "saved" && <span className="text-emerald-500 text-[10px]">● Saved</span>}
              {saveStatus === "unsaved" && <span className="text-amber-500 text-[10px]">● Unsaved</span>}
            </div>
          )}

          {/* AI Optimizer button */}
          {showAiTools && !readOnly && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setAiModalOpen(true);
                setAiResult(null);
              }}
              className="gap-1 border-indigo-200 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
              title="Enhance with AI"
            >
              <Sparkles className="w-3 h-3" />
              <span className="hidden sm:inline">AI Tools</span>
            </Button>
          )}

          {/* Manual Snapshot */}
          {!readOnly && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSnapshotOpen(true)}
              className="gap-1"
              title="Save Snapshot"
            >
              <BookmarkPlus className="w-3 h-3" />
              <span className="hidden sm:inline">Snapshot</span>
            </Button>
          )}

          {/* Copy Prompt */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="gap-1"
            title="Copy Prompt"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
            <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
          </Button>

          {/* Fullscreen Toggle */}
          <Button
            type="button"
            variant="ghost"
            size="iconSm"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>

      {/* Editor & Preview Body */}
      <div className="flex-1 flex overflow-hidden min-h-[400px]">
        {/* CodeMirror Editor Pane */}
        {(mode === "editor" || mode === "split") && (
          <div
            className={`flex-1 h-full overflow-hidden flex flex-col ${
              mode === "split" ? "border-r border-zinc-200 dark:border-zinc-800" : ""
            }`}
          >
            <CodeMirror
              value={content}
              height="100%"
              extensions={[markdown()]}
              onChange={handleContentChange}
              editable={!readOnly}
              theme="dark"
              basicSetup={{
                lineNumbers: true,
                highlightActiveLineGutter: true,
                highlightSpecialChars: true,
                history: true,
                foldGutter: true,
                drawSelection: true,
                dropCursor: true,
                allowMultipleSelections: true,
                indentOnInput: true,
                syntaxHighlighting: true,
                bracketMatching: true,
                closeBrackets: true,
                autocompletion: true,
                rectangularSelection: true,
                crosshairCursor: true,
                highlightActiveLine: true,
                highlightSelectionMatches: true,
                closeBracketsKeymap: true,
                defaultKeymap: true,
                searchKeymap: true,
                historyKeymap: true,
                foldKeymap: true,
                completionKeymap: true,
                lintKeymap: true,
              }}
              style={{
                height: "100%",
                fontSize: `${editorFontSize}px`,
              }}
            />
          </div>
        )}

        {/* Live Markdown Preview Pane */}
        {(mode === "preview" || mode === "split") && (
          <div className="flex-1 h-full overflow-y-auto p-4 bg-zinc-50/40 dark:bg-zinc-950/40 text-zinc-900 dark:text-zinc-100 text-xs leading-relaxed">
            {content.trim() ? (
              <div className="prose prose-xs dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-zinc-400 text-xs italic">
                Markdown preview will appear here as you type...
              </div>
            )}
          </div>
        )}
      </div>

      {/* Manual Snapshot Modal */}
      <Dialog open={snapshotOpen} onOpenChange={setSnapshotOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Version Snapshot</DialogTitle>
            <DialogDescription>
              Record an explicit version milestone in this prompt's revision history.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="snapshot-notes">Change Summary / Notes</Label>
            <Input
              id="snapshot-notes"
              placeholder="e.g., Added output formatting instructions and strict constraints"
              value={changeNotes}
              onChange={(e) => setChangeNotes(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setSnapshotOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreateSnapshot}>
              Create Snapshot
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Assistant Modal */}
      <Dialog open={aiModalOpen} onOpenChange={setAiModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              AI Prompt Assistant
            </DialogTitle>
            <DialogDescription>
              Analyze, polish, restructure, or evaluate your prompt with your configured AI provider.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  { id: "clarity", label: "Clarity & Brevity" },
                  { id: "structure", label: "Professional Structure" },
                  { id: "grammar", label: "Fix Grammar" },
                  { id: "critique", label: "Weakness Critique" },
                ] as const
              ).map((opt) => (
                <Button
                  key={opt.id}
                  type="button"
                  size="sm"
                  variant={aiMode === opt.id ? "default" : "outline"}
                  onClick={() => setAiMode(opt.id)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>

            <div className="flex justify-end">
              <Button size="sm" onClick={handleRunAiOptimization} disabled={aiLoading}>
                {aiLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                    Analyzing...
                  </>
                ) : (
                  "Run AI Analysis"
                )}
              </Button>
            </div>

            {aiResult && (
              <div className="space-y-2 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 bg-zinc-50 dark:bg-zinc-900/60 max-h-60 overflow-y-auto text-xs whitespace-pre-wrap font-mono">
                {aiResult}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setAiModalOpen(false)}>
              Close
            </Button>
            {aiResult && (
              <Button size="sm" onClick={applyAiResult}>
                Apply Suggestion to Editor
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
