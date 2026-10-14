"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Cpu,
  Key,
  Check,
  AlertCircle,
  Play,
  Trash2,
  Save,
  Loader2,
  Lock,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  saveAiProviderConfigAction,
  deleteAiProviderConfigAction,
  testAiConnectivityAction,
} from "@/features/settings/actions";

interface ProviderConfigItem {
  provider: string;
  isEnabled: boolean;
  hasKey: boolean;
  baseUrl?: string | null;
  defaultModel?: string | null;
}

const PROVIDER_METADATA: Record<string, { name: string; defaultModel: string; placeholderUrl: string }> = {
  openai: {
    name: "OpenAI",
    defaultModel: "gpt-4o-mini",
    placeholderUrl: "https://api.openai.com/v1",
  },
  anthropic: {
    name: "Anthropic",
    defaultModel: "claude-3-5-haiku",
    placeholderUrl: "https://api.anthropic.com/v1",
  },
  gemini: {
    name: "Google Gemini",
    defaultModel: "gemini-2.5-flash",
    placeholderUrl: "https://generativelanguage.googleapis.com",
  },
  openrouter: {
    name: "OpenRouter",
    defaultModel: "openai/gpt-4o-mini",
    placeholderUrl: "https://openrouter.ai/api/v1",
  },
  ollama: {
    name: "Ollama (Local LLM)",
    defaultModel: "llama3",
    placeholderUrl: "http://localhost:11434",
  },
};

export function AiSettingsClient({ configs }: { configs: ProviderConfigItem[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [testTestingProvider, setTestTestingProvider] = useState<string | null>(null);

  // Local editing states per provider
  const [formData, setFormData] = useState<
    Record<string, { isEnabled: boolean; apiKey: string; baseUrl: string; defaultModel: string }>
  >(() => {
    const state: any = {};
    for (const key of Object.keys(PROVIDER_METADATA)) {
      const existing = configs.find((c) => c.provider === key);
      state[key] = {
        isEnabled: existing ? existing.isEnabled : key === "ollama",
        apiKey: "",
        baseUrl: existing?.baseUrl || "",
        defaultModel: existing?.defaultModel || PROVIDER_METADATA[key].defaultModel,
      };
    }
    return state;
  });

  const handleFieldChange = (provider: string, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        [field]: value,
      },
    }));
  };

  const handleSaveProvider = (provider: string) => {
    const data = formData[provider];
    startTransition(async () => {
      const res = await saveAiProviderConfigAction({
        provider,
        isEnabled: data.isEnabled,
        apiKey: data.apiKey,
        baseUrl: data.baseUrl || null,
        defaultModel: data.defaultModel || null,
      });

      if (res.success) {
        toast.success(`${PROVIDER_METADATA[provider].name} configuration saved securely (AES-256-GCM)`);
        // Clear plaintext key input from memory for security
        handleFieldChange(provider, "apiKey", "");
        router.refresh();
      } else {
        toast.error(res.error || "Failed to save configuration");
      }
    });
  };

  const handleDeleteProvider = (provider: string) => {
    if (!confirm(`Remove stored credentials for ${PROVIDER_METADATA[provider].name}?`)) return;
    startTransition(async () => {
      const res = await deleteAiProviderConfigAction(provider);
      if (res.success) {
        toast.success(`Removed credentials for ${PROVIDER_METADATA[provider].name}`);
        router.refresh();
      } else {
        toast.error(res.error || "Failed to remove credentials");
      }
    });
  };

  const handleTestConnectivity = async (provider: string) => {
    setTestTestingProvider(provider);
    try {
      const res = await testAiConnectivityAction(provider);
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    } catch (err: any) {
      toast.error(err.message || "Connection test failed");
    } finally {
      setTestTestingProvider(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-3 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs space-y-1">
        <p className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-indigo-500" />
          End-to-End Encrypted AI Integration
        </p>
        <p className="text-[11px] text-zinc-500">
          API keys are encrypted server-side using AES-256-GCM with your server encryption key. Keys are never transmitted to client browser bundles or exposed in logs.
        </p>
      </div>

      <div className="space-y-4">
        {Object.entries(PROVIDER_METADATA).map(([providerKey, meta]) => {
          const config = configs.find((c) => c.provider === providerKey);
          const state = formData[providerKey];
          const hasKey = config?.hasKey;
          const isTesting = testTestingProvider === providerKey;

          return (
            <Card key={providerKey}>
              <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-2.5">
                  <Cpu className="w-4 h-4 text-indigo-500" />
                  <div>
                    <CardTitle className="text-xs font-semibold">{meta.name}</CardTitle>
                    <p className="text-[10px] text-zinc-400 font-mono">
                      Default: {meta.defaultModel}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {hasKey && (
                    <Badge variant="success" className="text-[9px] py-0">
                      Key Configured
                    </Badge>
                  )}
                  <Switch
                    checked={state.isEnabled}
                    onCheckedChange={(val) => handleFieldChange(providerKey, "isEnabled", val)}
                    title="Enable Provider"
                  />
                </div>
              </CardHeader>

              <CardContent className="space-y-3 pt-0 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* API Key Input */}
                  {providerKey !== "ollama" && (
                    <div className="space-y-1">
                      <Label htmlFor={`key-${providerKey}`}>
                        {hasKey ? "Update API Key (Leave blank to keep current)" : "API Key *"}
                      </Label>
                      <Input
                        id={`key-${providerKey}`}
                        type="password"
                        placeholder={hasKey ? "••••••••••••••••••••••••" : "sk-..."}
                        value={state.apiKey}
                        onChange={(e) => handleFieldChange(providerKey, "apiKey", e.target.value)}
                        className="font-mono text-xs"
                      />
                    </div>
                  )}

                  {/* Default Model */}
                  <div className="space-y-1">
                    <Label htmlFor={`model-${providerKey}`}>Default Model</Label>
                    <Input
                      id={`model-${providerKey}`}
                      value={state.defaultModel}
                      onChange={(e) => handleFieldChange(providerKey, "defaultModel", e.target.value)}
                      placeholder={meta.defaultModel}
                      className="font-mono text-xs"
                    />
                  </div>

                  {/* Base URL (Optional / Custom) */}
                  <div className="space-y-1 sm:col-span-2">
                    <Label htmlFor={`url-${providerKey}`}>Custom Base API URL (Optional)</Label>
                    <Input
                      id={`url-${providerKey}`}
                      value={state.baseUrl}
                      onChange={(e) => handleFieldChange(providerKey, "baseUrl", e.target.value)}
                      placeholder={meta.placeholderUrl}
                      className="font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800/60">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTestConnectivity(providerKey)}
                      disabled={isTesting || (!hasKey && providerKey !== "ollama" && !state.apiKey)}
                      className="gap-1.5 h-7 text-xs"
                    >
                      {isTesting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3 text-emerald-500" />}
                      Test Connectivity
                    </Button>

                    {hasKey && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteProvider(providerKey)}
                        className="h-7 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                      >
                        Remove Key
                      </Button>
                    )}
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleSaveProvider(providerKey)}
                    disabled={isPending}
                    className="gap-1.5 h-7 text-xs font-semibold"
                  >
                    {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                    Save Config
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
