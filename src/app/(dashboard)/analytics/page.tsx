import React from "react";
import prisma from "@/lib/db";
import {
  BarChart3,
  Copy,
  History,
  FileText,
  Star,
  Cpu,
  Coins,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CategoryBarChart, PlatformBarChart } from "./analytics-charts";

export default async function AnalyticsPage() {
  const [
    totalPrompts,
    totalCopiesAgg,
    totalVersions,
    favoriteCount,
    aiTests,
    categoriesWithCounts,
    promptsWithVersions,
    mostCopied,
  ] = await Promise.all([
    prisma.prompt.count({ where: { isDeleted: false } }),
    prisma.prompt.aggregate({
      _sum: { copyCount: true },
      where: { isDeleted: false },
    }),
    prisma.promptVersion.count(),
    prisma.prompt.count({ where: { isFavorite: true, isDeleted: false } }),
    prisma.aITestResult.findMany({
      select: {
        totalTokens: true,
        estimatedCost: true,
        provider: true,
        latencyMs: true,
      },
    }),
    prisma.category.findMany({
      select: {
        name: true,
        _count: { select: { prompts: { where: { isDeleted: false } } } },
      },
    }),
    prisma.prompt.findMany({
      where: { isDeleted: false },
      select: {
        id: true,
        title: true,
        targetPlatform: true,
        _count: { select: { versions: true } },
      },
      orderBy: { versions: { _count: "desc" } },
      take: 5,
    }),
    prisma.prompt.findMany({
      where: { isDeleted: false, copyCount: { gt: 0 } },
      select: {
        id: true,
        title: true,
        copyCount: true,
        estimatedTokens: true,
      },
      orderBy: { copyCount: "desc" },
      take: 5,
    }),
  ]);

  const totalCopies = totalCopiesAgg._sum.copyCount || 0;
  const totalAiTokens = aiTests.reduce((acc, t) => acc + (t.totalTokens || 0), 0);
  const totalAiCost = aiTests.reduce((acc, t) => acc + (t.estimatedCost || 0), 0);

  // Group by category
  const categoryData = categoriesWithCounts.map((c) => ({
    category: c.name,
    count: c._count.prompts,
  }));

  // Group by platform
  const platformCounts: Record<string, number> = {};
  for (const p of promptsWithVersions) {
    const plat = p.targetPlatform || "Universal";
    platformCounts[plat] = (platformCounts[plat] || 0) + 1;
  }
  const platformData = Object.entries(platformCounts).map(([platform, count]) => ({
    platform,
    count,
  }));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Analytics & Usage Intelligence
        </h1>
        <p className="text-xs text-zinc-500">
          Real metrics on prompt copying, version evolution, category allocation, and AI token usage.
        </p>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <Card className="p-3">
          <div className="text-[10px] text-zinc-500 font-medium">Total Prompts</div>
          <div className="text-xl font-bold mt-1 text-zinc-900 dark:text-zinc-100">{totalPrompts}</div>
        </Card>
        <Card className="p-3">
          <div className="text-[10px] text-zinc-500 font-medium flex items-center gap-1">
            <Copy className="w-3 h-3 text-indigo-500" /> Copies Run
          </div>
          <div className="text-xl font-bold mt-1 text-zinc-900 dark:text-zinc-100">{totalCopies}</div>
        </Card>
        <Card className="p-3">
          <div className="text-[10px] text-zinc-500 font-medium flex items-center gap-1">
            <History className="w-3 h-3 text-blue-500" /> Revisions
          </div>
          <div className="text-xl font-bold mt-1 text-zinc-900 dark:text-zinc-100">{totalVersions}</div>
        </Card>
        <Card className="p-3">
          <div className="text-[10px] text-zinc-500 font-medium flex items-center gap-1">
            <Star className="w-3 h-3 text-amber-500" /> Starred
          </div>
          <div className="text-xl font-bold mt-1 text-zinc-900 dark:text-zinc-100">{favoriteCount}</div>
        </Card>
        <Card className="p-3">
          <div className="text-[10px] text-zinc-500 font-medium flex items-center gap-1">
            <Cpu className="w-3 h-3 text-purple-500" /> AI Tests
          </div>
          <div className="text-xl font-bold mt-1 text-zinc-900 dark:text-zinc-100">{aiTests.length}</div>
        </Card>
        <Card className="p-3">
          <div className="text-[10px] text-zinc-500 font-medium">AI Tokens</div>
          <div className="text-xl font-bold mt-1 text-zinc-900 dark:text-zinc-100 font-mono">
            {totalAiTokens.toLocaleString()}
          </div>
        </Card>
        <Card className="p-3">
          <div className="text-[10px] text-zinc-500 font-medium flex items-center gap-1">
            <Coins className="w-3 h-3 text-emerald-500" /> Est. AI Cost
          </div>
          <div className="text-xl font-bold mt-1 text-zinc-900 dark:text-zinc-100 font-mono text-emerald-600 dark:text-emerald-400">
            ${totalAiCost.toFixed(4)}
          </div>
        </Card>
      </div>

      {/* Distribution Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold">Prompts by Category</CardTitle>
            <CardDescription className="text-[11px]">Distribution across knowledge domains</CardDescription>
          </CardHeader>
          <CardContent>
            <CategoryBarChart data={categoryData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold">Prompts by Target Platform</CardTitle>
            <CardDescription className="text-[11px]">LLM ecosystem allocation</CardDescription>
          </CardHeader>
          <CardContent>
            <PlatformBarChart data={platformData} />
          </CardContent>
        </Card>
      </div>

      {/* Top Tables: Most Copied & Most Iterated */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Most Copied */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
              <Copy className="w-3.5 h-3.5 text-indigo-500" />
              Most Frequently Copied Prompts
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-zinc-100 dark:divide-zinc-800/60 p-0">
            {mostCopied.length === 0 ? (
              <div className="p-6 text-center text-xs text-zinc-400 italic">No copy events recorded yet.</div>
            ) : (
              mostCopied.map((p) => (
                <div key={p.id} className="p-3 flex items-center justify-between text-xs">
                  <Link
                    href={`/prompts/${p.id}`}
                    className="font-medium text-zinc-900 dark:text-zinc-100 hover:text-indigo-600 dark:hover:text-indigo-400 truncate pr-2 hover:underline"
                  >
                    {p.title}
                  </Link>
                  <div className="flex items-center gap-2 shrink-0 font-mono text-[10px]">
                    <span className="text-zinc-400">~{p.estimatedTokens} tok</span>
                    <Badge variant="secondary">{p.copyCount} copies</Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Most Edited / Highest Iterations */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-blue-500" />
              Highest Iteration Prompts (By Revisions)
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-zinc-100 dark:divide-zinc-800/60 p-0">
            {promptsWithVersions.length === 0 ? (
              <div className="p-6 text-center text-xs text-zinc-400 italic">No version records yet.</div>
            ) : (
              promptsWithVersions.map((p) => (
                <div key={p.id} className="p-3 flex items-center justify-between text-xs">
                  <Link
                    href={`/prompts/${p.id}`}
                    className="font-medium text-zinc-900 dark:text-zinc-100 hover:text-indigo-600 dark:hover:text-indigo-400 truncate pr-2 hover:underline"
                  >
                    {p.title}
                  </Link>
                  <div className="flex items-center gap-2 shrink-0 font-mono text-[10px]">
                    <Badge variant="outline">{p._count.versions} revisions</Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
