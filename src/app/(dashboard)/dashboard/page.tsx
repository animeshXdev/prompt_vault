import React from "react";
import Link from "next/link";
import prisma from "@/lib/db";
import {
  FileText,
  Folder,
  Briefcase,
  Star,
  Pin,
  Archive,
  History,
  Copy,
  Plus,
  Sparkles,
  FolderPlus,
  FileCode,
  ArrowUpRight,
  Clock,
  Layers,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateShort, formatDate } from "@/lib/utils";
import { CreationTrendChart, DistributionPieChart } from "./dashboard-charts";

export default async function DashboardPage() {
  const [
    totalPrompts,
    totalFolders,
    totalCategories,
    totalWorkspaces,
    favoritePrompts,
    pinnedPrompts,
    archivedPrompts,
    totalVersions,
    mostCopiedPrompts,
    recentlyCreatedPrompts,
    recentlyModifiedPrompts,
    recentActivity,
    workspacesWithCounts,
  ] = await Promise.all([
    prisma.prompt.count({ where: { isDeleted: false } }),
    prisma.folder.count(),
    prisma.category.count(),
    prisma.workspace.count({ where: { isArchived: false } }),
    prisma.prompt.count({ where: { isFavorite: true, isDeleted: false } }),
    prisma.prompt.count({ where: { isPinned: true, isDeleted: false } }),
    prisma.prompt.count({ where: { isArchived: true, isDeleted: false } }),
    prisma.promptVersion.count(),
    prisma.prompt.findMany({
      where: { isDeleted: false, copyCount: { gt: 0 } },
      orderBy: { copyCount: "desc" },
      take: 5,
      include: { folder: true },
    }),
    prisma.prompt.findMany({
      where: { isDeleted: false },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { folder: true },
    }),
    prisma.prompt.findMany({
      where: { isDeleted: false },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: { folder: true },
    }),
    prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.workspace.findMany({
      where: { isArchived: false },
      select: { name: true, _count: { select: { prompts: true } } },
      take: 6,
    }),
  ]);

  // Compute 7-day creation trend from actual SQLite records
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const promptsLast7Days = await prisma.prompt.findMany({
    where: {
      createdAt: { gte: sevenDaysAgo },
    },
    select: { createdAt: true },
  });

  const trendMap = new Map<string, number>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    trendMap.set(key, 0);
  }

  for (const p of promptsLast7Days) {
    const key = new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    if (trendMap.has(key)) {
      trendMap.set(key, (trendMap.get(key) || 0) + 1);
    }
  }

  const creationTrendData = Array.from(trendMap.entries()).map(([date, count]) => ({
    date,
    count,
  }));

  const workspaceDistributionData = workspacesWithCounts
    .filter((ws) => ws._count.prompts > 0)
    .map((ws) => ({
      name: ws.name,
      value: ws._count.prompts,
    }));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner: Quick Stats & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Vault Overview
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Real-time analytics and prompt inventory for your private workspace.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild size="sm" className="gap-1.5 shadow-xs">
            <Link href="/prompts/new">
              <Plus className="w-3.5 h-3.5" />
              <span>Create Prompt</span>
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link href="/composer">
              <Sparkles className="w-3.5 h-3.5 text-purple-500" />
              <span>Composer</span>
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link href="/templates">
              <FileCode className="w-3.5 h-3.5 text-emerald-500" />
              <span>Templates</span>
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link href="/settings/storage">
              <Upload className="w-3.5 h-3.5 text-blue-500" />
              <span>Import</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Metrics Row 1 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <Card className="p-3">
          <div className="text-[10px] text-zinc-500 font-medium">Total Prompts</div>
          <div className="text-xl font-bold mt-1 text-zinc-900 dark:text-zinc-100">{totalPrompts}</div>
        </Card>
        <Card className="p-3">
          <div className="text-[10px] text-zinc-500 font-medium">Folders</div>
          <div className="text-xl font-bold mt-1 text-zinc-900 dark:text-zinc-100">{totalFolders}</div>
        </Card>
        <Card className="p-3">
          <div className="text-[10px] text-zinc-500 font-medium">Categories</div>
          <div className="text-xl font-bold mt-1 text-zinc-900 dark:text-zinc-100">{totalCategories}</div>
        </Card>
        <Card className="p-3">
          <div className="text-[10px] text-zinc-500 font-medium">Workspaces</div>
          <div className="text-xl font-bold mt-1 text-zinc-900 dark:text-zinc-100">{totalWorkspaces}</div>
        </Card>
        <Card className="p-3">
          <div className="text-[10px] text-zinc-500 font-medium flex items-center gap-1">
            <Star className="w-3 h-3 text-amber-500" /> Favorites
          </div>
          <div className="text-xl font-bold mt-1 text-zinc-900 dark:text-zinc-100">{favoritePrompts}</div>
        </Card>
        <Card className="p-3">
          <div className="text-[10px] text-zinc-500 font-medium flex items-center gap-1">
            <Pin className="w-3 h-3 text-indigo-500" /> Pinned
          </div>
          <div className="text-xl font-bold mt-1 text-zinc-900 dark:text-zinc-100">{pinnedPrompts}</div>
        </Card>
        <Card className="p-3">
          <div className="text-[10px] text-zinc-500 font-medium flex items-center gap-1">
            <History className="w-3 h-3 text-blue-500" /> Revisions
          </div>
          <div className="text-xl font-bold mt-1 text-zinc-900 dark:text-zinc-100">{totalVersions}</div>
        </Card>
        <Card className="p-3">
          <div className="text-[10px] text-zinc-500 font-medium flex items-center gap-1">
            <Archive className="w-3 h-3 text-zinc-400" /> Archived
          </div>
          <div className="text-xl font-bold mt-1 text-zinc-900 dark:text-zinc-100">{archivedPrompts}</div>
        </Card>
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Creation Trend */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold">Prompt Creation Trend</CardTitle>
            <CardDescription className="text-[11px]">Daily additions over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <CreationTrendChart data={creationTrendData} />
          </CardContent>
        </Card>

        {/* Workspace Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold">Workspace Distribution</CardTitle>
            <CardDescription className="text-[11px]">Prompt allocation by project</CardDescription>
          </CardHeader>
          <CardContent>
            <DistributionPieChart data={workspaceDistributionData} />
          </CardContent>
        </Card>
      </div>

      {/* Lists Row: Most Copied, Recently Created, and Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Most Copied */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
              <Copy className="w-3.5 h-3.5 text-indigo-500" />
              Frequently Copied
            </CardTitle>
            <Link href="/prompts?sortBy=copied" className="text-[11px] text-indigo-500 hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="divide-y divide-zinc-100 dark:divide-zinc-800/60 p-0">
            {mostCopiedPrompts.length === 0 ? (
              <div className="p-4 text-xs text-zinc-400 italic text-center">No copies recorded yet.</div>
            ) : (
              mostCopiedPrompts.map((p) => (
                <Link
                  key={p.id}
                  href={`/prompts/${p.id}`}
                  className="flex items-center justify-between p-3 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
                >
                  <div className="truncate pr-2">
                    <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate">{p.title}</p>
                    <p className="text-[10px] text-zinc-400">{p.folder?.name || "Unfiled"}</p>
                  </div>
                  <Badge variant="secondary" className="font-mono text-[10px] shrink-0">
                    {p.copyCount} copies
                  </Badge>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recently Modified */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              Recently Modified
            </CardTitle>
            <Link href="/prompts?sortBy=updated" className="text-[11px] text-indigo-500 hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="divide-y divide-zinc-100 dark:divide-zinc-800/60 p-0">
            {recentlyModifiedPrompts.length === 0 ? (
              <div className="p-4 text-xs text-zinc-400 italic text-center">No prompts saved yet.</div>
            ) : (
              recentlyModifiedPrompts.map((p) => (
                <Link
                  key={p.id}
                  href={`/prompts/${p.id}`}
                  className="flex items-center justify-between p-3 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
                >
                  <div className="truncate pr-2">
                    <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate">{p.title}</p>
                    <p className="text-[10px] text-zinc-400">{p.folder?.name || "Unfiled"}</p>
                  </div>
                  <span className="text-[10px] text-zinc-400 shrink-0 font-mono">
                    {formatDateShort(p.updatedAt)}
                  </span>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        {/* Audit & Activity */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-emerald-500" />
              Recent Activity
            </CardTitle>
            <Link href="/activity" className="text-[11px] text-indigo-500 hover:underline">
              Full log
            </Link>
          </CardHeader>
          <CardContent className="divide-y divide-zinc-100 dark:divide-zinc-800/60 p-0">
            {recentActivity.length === 0 ? (
              <div className="p-4 text-xs text-zinc-400 italic text-center">No activity logged yet.</div>
            ) : (
              recentActivity.map((log) => (
                <div key={log.id} className="p-3 text-xs flex items-center justify-between">
                  <div className="truncate pr-2">
                    <span className="font-mono text-[11px] text-indigo-600 dark:text-indigo-400">
                      {log.action.replace(/_/g, " ")}
                    </span>
                    <span className="text-[10px] text-zinc-400 block truncate">{log.entityType}</span>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono shrink-0">
                    {formatDateShort(log.createdAt)}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
