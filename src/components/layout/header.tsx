"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search,
  Plus,
  User,
  Shield,
  LogOut,
  ChevronRight,
  Sparkles,
  FolderPlus,
  Briefcase,
  FileCode,
} from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logoutAction } from "@/features/auth/actions";

interface HeaderProps {
  adminEmail?: string;
  onOpenCommandPalette?: () => void;
}

export function Header({ adminEmail = "admin@example.com", onOpenCommandPalette }: HeaderProps) {
  const pathname = usePathname();

  // Generate breadcrumb items from pathname
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs = segments.map((seg, idx) => {
    const href = "/" + segments.slice(0, idx + 1).join("/");
    const label = seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    return { href, label };
  });

  return (
    <header className="h-12 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xs px-4 flex items-center justify-between sticky top-0 z-40 select-none">
      {/* Left: Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-xs text-zinc-500 overflow-hidden">
        <Link href="/dashboard" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
          Vault
        </Link>
        {breadcrumbs.map((bc, idx) => (
          <React.Fragment key={bc.href}>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <Link
              href={bc.href}
              className={`truncate max-w-[150px] transition-colors ${
                idx === breadcrumbs.length - 1
                  ? "text-zinc-900 dark:text-zinc-100 font-medium"
                  : "hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              {bc.label}
            </Link>
          </React.Fragment>
        ))}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Global Search Button */}
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="hidden sm:flex items-center gap-2 h-8 px-2.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 text-xs shadow-2xs transition-colors cursor-pointer"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Search vault...</span>
          <kbd className="text-[10px] font-mono bg-white dark:bg-zinc-800 px-1 rounded border border-zinc-200 dark:border-zinc-700">
            Ctrl+K
          </kbd>
        </button>

        {/* Quick Create Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline" className="gap-1.5 h-8">
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Create</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <Link href="/prompts/new" className="flex items-center gap-2 cursor-pointer">
                <Plus className="w-3.5 h-3.5 text-indigo-500" />
                <span>New Prompt</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/folders" className="flex items-center gap-2 cursor-pointer">
                <FolderPlus className="w-3.5 h-3.5 text-amber-500" />
                <span>New Folder</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/workspaces/new" className="flex items-center gap-2 cursor-pointer">
                <Briefcase className="w-3.5 h-3.5 text-blue-500" />
                <span>New Workspace</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/templates" className="flex items-center gap-2 cursor-pointer">
                <FileCode className="w-3.5 h-3.5 text-emerald-500" />
                <span>New Template</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/composer" className="flex items-center gap-2 cursor-pointer">
                <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                <span>Prompt Composer</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Account Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="iconSm" className="rounded-full bg-zinc-100 dark:bg-zinc-800">
              <User className="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-0.5">
                <p className="text-xs font-semibold leading-none text-zinc-900 dark:text-zinc-100">Administrator</p>
                <p className="text-[11px] leading-none text-zinc-400 font-mono truncate">{adminEmail}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings" className="flex items-center gap-2 cursor-pointer">
                <Shield className="w-3.5 h-3.5 text-zinc-400" />
                <span>Settings & Security</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/activity" className="flex items-center gap-2 cursor-pointer">
                <User className="w-3.5 h-3.5 text-zinc-400" />
                <span>Audit & Activity</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <form action={logoutAction} className="w-full">
              <DropdownMenuItem asChild>
                <button
                  type="submit"
                  className="w-full text-left flex items-center gap-2 text-red-600 dark:text-red-400 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log out</span>
                </button>
              </DropdownMenuItem>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
