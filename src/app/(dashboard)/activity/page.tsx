import React from "react";
import prisma from "@/lib/db";
import { Clock, ShieldCheck, FileText, Database, UserCheck, KeyRound, HardDrive } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export default async function ActivityPage() {
  const activities = await prisma.activityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const getActionIcon = (action: string) => {
    if (action.includes("prompt")) return <FileText className="w-3.5 h-3.5 text-indigo-500" />;
    if (action.includes("login")) return <UserCheck className="w-3.5 h-3.5 text-emerald-500" />;
    if (action.includes("password")) return <KeyRound className="w-3.5 h-3.5 text-amber-500" />;
    if (action.includes("backup")) return <Database className="w-3.5 h-3.5 text-blue-500" />;
    return <Clock className="w-3.5 h-3.5 text-zinc-400" />;
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <div className="flex items-center gap-2">
        <Clock className="w-5 h-5 text-indigo-500" />
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            System Activity & Audit Log
          </h1>
          <p className="text-xs text-zinc-500">
            Real-time audit log recording authentication milestones, prompt modifications, and vault backups.
          </p>
        </div>
      </div>

      {activities.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg text-xs text-zinc-400 italic">
          No activity logs recorded yet.
        </div>
      ) : (
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden bg-white dark:bg-zinc-900/60 shadow-2xs divide-y divide-zinc-200 dark:divide-zinc-800">
          <div className="flex items-center px-4 py-2 bg-zinc-50 dark:bg-zinc-950 text-[11px] font-semibold text-zinc-500">
            <div className="w-48">Action</div>
            <div className="flex-1 px-2">Details</div>
            <div className="w-28 px-2 text-right">IP Address</div>
            <div className="w-36 text-right">Timestamp</div>
          </div>

          {activities.map((act) => {
            let detailsObj: any = null;
            if (act.detailsJson) {
              try {
                detailsObj = JSON.parse(act.detailsJson);
              } catch {}
            }

            return (
              <div
                key={act.id}
                className="flex items-center px-4 py-2.5 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
              >
                <div className="w-48 flex items-center gap-2 truncate pr-2">
                  {getActionIcon(act.action)}
                  <span className="font-mono text-[11px] font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                    {act.action.replace(/_/g, " ")}
                  </span>
                </div>

                <div className="flex-1 px-2 truncate text-zinc-500 font-mono text-[11px]">
                  {detailsObj ? (
                    <span className="truncate">
                      {detailsObj.title || detailsObj.name || detailsObj.email || JSON.stringify(detailsObj)}
                    </span>
                  ) : (
                    <span className="text-zinc-400">—</span>
                  )}
                </div>

                <div className="w-28 px-2 text-right font-mono text-[10px] text-zinc-400">
                  {act.ipAddress || "127.0.0.1"}
                </div>

                <div className="w-36 text-right font-mono text-[10px] text-zinc-400">
                  {formatDate(act.createdAt)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
