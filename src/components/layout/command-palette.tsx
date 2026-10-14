"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Sparkles, Folder, Briefcase, FileCode, Plus, LogOut, Settings } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { logoutAction } from "@/features/auth/actions";

export interface SearchItem {
  id: string;
  type: "prompt" | "workspace" | "template" | "folder" | "action";
  title: string;
  subtitle?: string;
  href: string;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchItem[]>([]);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Quick navigation items
  const quickActions: SearchItem[] = [
    { id: "new-prompt", type: "action", title: "Create New Prompt", subtitle: "Open prompt editor", href: "/prompts/new" },
    { id: "composer", type: "action", title: "Open Prompt Composer", subtitle: "Combine modular instructions", href: "/composer" },
    { id: "playground", type: "action", title: "Open AI Playground", subtitle: "Test prompts against LLMs", href: "/playground" },
    { id: "templates", type: "action", title: "Manage Templates", subtitle: "Dynamic variable templates", href: "/templates" },
    { id: "workspaces", type: "action", title: "View Workspaces", subtitle: "Project standards & contexts", href: "/workspaces" },
    { id: "settings", type: "action", title: "Application Settings", subtitle: "Security, AI, storage", href: "/settings" },
  ];

  const handleSelect = (item: SearchItem) => {
    setOpen(false);
    setQuery("");
    router.push(item.href);
  };

  const filtered = query.trim()
    ? quickActions.filter((i) => i.title.toLowerCase().includes(query.toLowerCase()) || i.subtitle?.toLowerCase().includes(query.toLowerCase()))
    : quickActions;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0 overflow-hidden max-w-lg shadow-2xl border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center px-3 border-b border-zinc-200 dark:border-zinc-800">
          <Search className="w-4 h-4 text-zinc-400 mr-2 shrink-0" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search..."
            className="border-none shadow-none focus-visible:ring-0 text-sm h-11 px-0 bg-transparent"
            autoFocus
          />
          <kbd className="hidden sm:inline-block text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded px-1.5 py-0.5 border border-zinc-200 dark:border-zinc-700 font-mono">
            ESC
          </kbd>
        </div>

        <div className="max-h-72 overflow-y-auto p-2 space-y-1">
          <div className="text-[10px] font-semibold text-zinc-400 px-2 py-1 uppercase tracking-wider">
            Quick Actions & Navigation
          </div>
          {filtered.length === 0 ? (
            <div className="p-4 text-center text-xs text-zinc-400 italic">No matching commands found.</div>
          ) : (
            filtered.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item)}
                className="w-full text-left px-2.5 py-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800/80 flex items-center justify-between group transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                    {item.id === "new-prompt" && <Plus className="w-3.5 h-3.5" />}
                    {item.id === "composer" && <Sparkles className="w-3.5 h-3.5" />}
                    {item.id === "playground" && <FileCode className="w-3.5 h-3.5" />}
                    {item.id === "templates" && <FileCode className="w-3.5 h-3.5" />}
                    {item.id === "workspaces" && <Briefcase className="w-3.5 h-3.5" />}
                    {item.id === "settings" && <Settings className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <div className="text-xs font-medium text-zinc-900 dark:text-zinc-100">{item.title}</div>
                    {item.subtitle && <div className="text-[11px] text-zinc-400">{item.subtitle}</div>}
                  </div>
                </div>
                <span className="text-[10px] text-zinc-400 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                  Enter ↵
                </span>
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
