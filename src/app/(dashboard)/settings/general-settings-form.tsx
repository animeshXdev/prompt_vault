"use client";

import React, { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save, Loader2, User, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { updateAppSettingsAction } from "@/features/settings/actions";

interface GeneralFormProps {
  adminEmail: string;
  settings: {
    appName: string;
    defaultWorkspaceId?: string | null;
    defaultAiPlatform?: string | null;
    defaultCategoryId?: string | null;
    themePreference: string;
  };
  workspaces: { id: string; name: string }[];
  categories: { id: string; name: string }[];
}

export function GeneralSettingsForm({
  adminEmail,
  settings,
  workspaces,
  categories,
}: GeneralFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [appName, setAppName] = React.useState(settings.appName);
  const [defaultWorkspaceId, setDefaultWorkspaceId] = React.useState(settings.defaultWorkspaceId || "");
  const [defaultAiPlatform, setDefaultAiPlatform] = React.useState(settings.defaultAiPlatform || "openai");
  const [defaultCategoryId, setDefaultCategoryId] = React.useState(settings.defaultCategoryId || "");
  const [themePreference, setThemePreference] = React.useState(settings.themePreference || "system");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await updateAppSettingsAction({
        appName: appName.trim(),
        defaultWorkspaceId: defaultWorkspaceId || null,
        defaultAiPlatform,
        defaultCategoryId: defaultCategoryId || null,
        themePreference,
      });

      if (res.success) {
        toast.success("General settings updated successfully");
        router.refresh();
      } else {
        toast.error(res.error || "Failed to update settings");
      }
    });
  };

  return (
    <form onSubmit={handleSave} className="space-y-4">
      {/* Profile Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-semibold flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-500" />
            Administrator Profile
          </CardTitle>
          <CardDescription className="text-[11px]">
            Fixed single-tenant administrator credentials.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          <div className="space-y-1">
            <Label htmlFor="admin-email">Administrator Email (Read-Only)</Label>
            <Input
              id="admin-email"
              value={adminEmail}
              disabled
              className="bg-zinc-100 dark:bg-zinc-800/60 font-mono text-zinc-500 cursor-not-allowed"
            />
            <p className="text-[10px] text-zinc-400">
              The administrator email is configured via environment variables and remains fixed.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Application Preferences */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-semibold flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-500" />
            Application Preferences
          </CardTitle>
          <CardDescription className="text-[11px]">
            Vault branding and default creation attributes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="app-name">Vault Name</Label>
              <Input
                id="app-name"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                placeholder="PromptVault"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="default-platform">Default AI Ecosystem</Label>
              <select
                id="default-platform"
                value={defaultAiPlatform}
                onChange={(e) => setDefaultAiPlatform(e.target.value)}
                className="w-full h-8 px-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs"
              >
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
                <option value="gemini">Google Gemini</option>
                <option value="ollama">Ollama (Local)</option>
                <option value="openrouter">OpenRouter</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="default-ws">Default Workspace</Label>
              <select
                id="default-ws"
                value={defaultWorkspaceId}
                onChange={(e) => setDefaultWorkspaceId(e.target.value)}
                className="w-full h-8 px-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs"
              >
                <option value="">(None - Global Vault)</option>
                {workspaces.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="default-cat">Default Category</Label>
              <select
                id="default-cat"
                value={defaultCategoryId}
                onChange={(e) => setDefaultCategoryId(e.target.value)}
                className="w-full h-8 px-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs"
              >
                <option value="">(None)</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" size="sm" disabled={isPending} className="gap-1.5 font-semibold">
              {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save Preferences
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
