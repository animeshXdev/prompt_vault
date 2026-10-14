"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Star,
  Pin,
  Briefcase,
  Folder,
  Tag,
  Hash,
  ShieldCheck,
  FileCode,
  Sparkles,
  Cpu,
  Paperclip,
  BarChart3,
  Clock,
  Archive,
  Trash2,
  Settings,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";
import { PromptVaultLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

const PRIMARY_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "All Prompts", href: "/prompts", icon: FileText },
  { label: "Favorites", href: "/favorites", icon: Star },
  { label: "Pinned", href: "/pinned", icon: Pin },
];

const ORGANIZATION_NAV: NavItem[] = [
  { label: "Workspaces", href: "/workspaces", icon: Briefcase },
  { label: "Folders", href: "/folders", icon: Folder },
  { label: "Categories", href: "/categories", icon: Tag },
  { label: "Tags", href: "/tags", icon: Hash },
];

const POWER_TOOLS_NAV: NavItem[] = [
  { label: "Master Prompts", href: "/master-prompts", icon: ShieldCheck },
  { label: "Templates", href: "/templates", icon: FileCode },
  { label: "Composer", href: "/composer", icon: Sparkles },
  { label: "AI Playground", href: "/playground", icon: Cpu },
  { label: "Files", href: "/files", icon: Paperclip },
];

const SYSTEM_NAV: NavItem[] = [
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Activity", href: "/activity", icon: Clock },
  { label: "Archive", href: "/archive", icon: Archive },
  { label: "Trash", href: "/trash", icon: Trash2 },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar({ counts }: { counts?: Record<string, number> }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const renderSection = (title: string, items: NavItem[]) => (
    <div className="space-y-0.5 py-1.5">
      {!collapsed && (
        <div className="px-2.5 py-1 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider select-none">
          {title}
        </div>
      )}
      {items.map((item) => {
        const Icon = item.icon;
        const isActive =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(item.href));
        const badgeCount = counts ? counts[item.href.replace("/", "")] : undefined;

        return (
          <Link
            key={item.href}
            href={item.href}
            title={collapsed ? item.label : undefined}
            className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors group relative ${
              isActive
                ? "bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
            } ${collapsed ? "justify-center px-1.5" : ""}`}
          >
            <Icon
              className={`w-4 h-4 shrink-0 transition-colors ${
                isActive
                  ? "text-indigo-600 dark:text-indigo-400"
                  : "text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300"
              }`}
            />
            {!collapsed && <span className="truncate">{item.label}</span>}
            {!collapsed && typeof badgeCount === "number" && badgeCount > 0 && (
              <span className="ml-auto text-[10px] bg-zinc-200/80 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-1.5 py-0.2 rounded-full font-mono">
                {badgeCount}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );

  return (
    <aside
      className={`border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 flex flex-col shrink-0 transition-all duration-200 select-none ${
        collapsed ? "w-14" : "w-56"
      }`}
    >
      {/* Brand Header */}
      <div className="h-12 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-3">
        <Link href="/dashboard" className="flex items-center gap-2 overflow-hidden">
          <PromptVaultLogo className="w-5 h-5 text-indigo-600 dark:text-indigo-500" showText={!collapsed} />
        </Link>
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1 rounded hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Quick Create Button */}
      <div className="p-2 border-b border-zinc-200/60 dark:border-zinc-800/60">
        <Button
          asChild
          size="sm"
          className={`w-full justify-center gap-1 shadow-xs ${collapsed ? "px-0" : ""}`}
        >
          <Link href="/prompts/new" title="New Prompt">
            <Plus className="w-3.5 h-3.5" />
            {!collapsed && <span>New Prompt</span>}
          </Link>
        </Button>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-2">
        {renderSection("Library", PRIMARY_NAV)}
        {renderSection("Organization", ORGANIZATION_NAV)}
        {renderSection("Advanced", POWER_TOOLS_NAV)}
        {renderSection("Management", SYSTEM_NAV)}
      </div>

      {/* Footer Info */}
      {!collapsed && (
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 text-[10px] text-zinc-400 flex items-center justify-between">
          <span>PromptVault v1.0</span>
          <span className="flex items-center gap-1 text-emerald-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Online
          </span>
        </div>
      )}
    </aside>
  );
}
