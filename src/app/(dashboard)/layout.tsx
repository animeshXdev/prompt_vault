import React from "react";
import { redirect } from "next/navigation";
import prisma from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { CommandPalette } from "@/components/layout/command-palette";
import { Toaster } from "sonner";
import { bootstrapSystem } from "@/lib/auth/bootstrap";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Ensure database bootstrap has initialized
  await bootstrapSystem().catch(() => {});

  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  // Fetch real-time live counts for sidebar badges
  const [favoritesCount, pinnedCount, archiveCount, trashCount] = await Promise.all([
    prisma.prompt.count({ where: { isFavorite: true, isDeleted: false } }).catch(() => 0),
    prisma.prompt.count({ where: { isPinned: true, isDeleted: false } }).catch(() => 0),
    prisma.prompt.count({ where: { isArchived: true, isDeleted: false } }).catch(() => 0),
    prisma.prompt.count({ where: { isDeleted: true } }).catch(() => 0),
  ]);

  const counts: Record<string, number> = {
    favorites: favoritesCount,
    pinned: pinnedCount,
    archive: archiveCount,
    trash: trashCount,
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <Sidebar counts={counts} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header adminEmail={session.admin.email} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-zinc-50/50 dark:bg-zinc-950/50">
          {children}
        </main>
      </div>
      <CommandPalette />
      <Toaster position="bottom-right" richColors theme="system" />
    </div>
  );
}
