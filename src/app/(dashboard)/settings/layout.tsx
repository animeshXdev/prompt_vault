"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, Shield, Sliders, Cpu, HardDrive, Database } from "lucide-react";

const SETTINGS_TABS = [
  { label: "General & Profile", href: "/settings", icon: Settings },
  { label: "Security & Sessions", href: "/settings/security", icon: Shield },
  { label: "Editor Preferences", href: "/settings/editor", icon: Sliders },
  { label: "AI Providers", href: "/settings/ai", icon: Cpu },
  { label: "Storage & Data", href: "/settings/storage", icon: HardDrive },
  { label: "Backup & Restore", href: "/settings/backup", icon: Database },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Application Settings
        </h1>
        <p className="text-xs text-zinc-500">
          Configure security credentials, theme preferences, editor behaviors, and AI providers.
        </p>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-zinc-200 dark:border-zinc-800 pb-2 text-xs">
        {SETTINGS_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors shrink-0 ${
                isActive
                  ? "bg-zinc-200/80 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="pt-2">{children}</div>
    </div>
  );
}
