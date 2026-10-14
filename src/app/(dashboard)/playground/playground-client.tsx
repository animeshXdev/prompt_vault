"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Cpu,
  Play,
  Sparkles,
  Star,
  Loader2,
  Clock,
  Coins,
  Settings,
  AlertCircle,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { runPlaygroundTestAction, rateAITestResultAction } from "@/features/ai/actions";

interface ProviderSummary {
  provider: string;
  isEnabled: boolean;
  hasKey: boolean;
  defaultModel?: string | null;
}

export function PlaygroundClient({
  providers,
  history,
}: {
  providers: ProviderSummary[];
  history: any[];
}) {
  const [selectedProvider, setSelectedProvider] = useState<any>(
    providers.find((p) => p.isEnabled && p.hasKey)?.provider || "openai"
  );
  const [model, setModel] = useState("gpt-4o-mini");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [userPrompt, setUserPrompt] = useState("");
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2048);

  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  const activeProviderConfig = providers.find((p) => p.provider === selectedProvider);
  const isConfigured = activeProviderConfig?.isEnabled && (activeProviderConfig.hasKey || selectedProvider === "ollama");

  const handleRun = async () => {
    if (!userPrompt.trim()) {
      toast.error("Please enter a user prompt");
      return;
    }

    setIsLoading(true);
    setResponse(null);

    try {
      const res = await runPlaygroundTestAction({
        provider: selectedProvider,
        model,
        systemPrompt: systemPrompt.trim() || undefined,
        userPrompt: userPrompt.trim(),
        temperature,
        maxTokens,
      });

      if (res.success) {
        setResponse(res);
        toast.success(`Completed in ${res.latencyMs}ms`);
      } else {
        toast.error(res.error || "Execution failed");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to communicate with provider");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRate = async (testId: string, rating: number) => {
    try {
      await rateAITestResultAction(testId, rating);
      toast.success(`Rated ${rating} stars`);
    } catch {
      toast.error("Failed to rate");
    }
  };

  const handleCopy = () => {
    if (!response?.content) return;
    navigator.clipboard.writeText(response.content);
    setCopied(true);
    toast.success("Output copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              AI Playground & Model Testing
            </h1>
            <p className="text-xs text-zinc-500">
              Directly evaluate prompts across LLM providers with real latency, token counts, and cost metrics.
            </p>
          </div>
        </div>

        <Button asChild variant="outline" size="sm" className="gap-1.5">
          <Link href="/settings/ai">
            <Settings className="w-3.5 h-3.5" />
            <span>AI Provider Settings</span>
          </Link>
        </Button>
      </div>

      {!isConfigured && (
        <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-start gap-3 text-xs text-amber-800 dark:text-amber-200">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">Selected provider is not configured</p>
            <p className="text-[11px] text-amber-700 dark:text-amber-300">
              Please configure and save your API key in{" "}
              <Link href="/settings/ai" className="underline font-medium">
                Settings → AI Providers
              </Link>{" "}
              to enable real-time playground testing.
            </p>
          </div>
        </div>
      )}

      {/* Main Grid: Parameters & Input (Left) & Output (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Form: Inputs & Parameters */}
        <div className="lg:col-span-6 space-y-4 bg-white dark:bg-zinc-900/60 p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-2xs">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <Label htmlFor="pg-provider">Provider</Label>
              <select
                id="pg-provider"
                value={selectedProvider}
                onChange={(e) => {
                  const p = e.target.value;
                  setSelectedProvider(p);
                  if (p === "openai") setModel("gpt-4o-mini");
                  if (p === "anthropic") setModel("claude-3-5-haiku");
                  if (p === "gemini") setModel("gemini-2.5-flash");
                  if (p === "ollama") setModel("llama3");
                }}
                className="w-full h-8 px-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs"
              >
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
                <option value="gemini">Google Gemini</option>
                <option value="openrouter">OpenRouter</option>
                <option value="ollama">Ollama (Local)</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="pg-model">Model</Label>
              <Input
                id="pg-model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="font-mono text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="pg-temp">Temperature: {temperature}</Label>
              <input
                id="pg-temp"
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full mt-2"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="pg-tokens">Max Tokens</Label>
              <Input
                id="pg-tokens"
                type="number"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value) || 2048)}
              />
            </div>
          </div>

          <div className="space-y-1 text-xs">
            <Label htmlFor="pg-system">System Prompt (Optional)</Label>
            <Textarea
              id="pg-system"
              rows={3}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="System instructions or developer persona..."
              className="font-mono text-xs"
            />
          </div>

          <div className="space-y-1 text-xs">
            <Label htmlFor="pg-user">User Prompt *</Label>
            <Textarea
              id="pg-user"
              rows={8}
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              placeholder="Enter your prompt test case here..."
              className="font-mono text-xs leading-relaxed"
            />
          </div>

          <Button
            size="sm"
            onClick={handleRun}
            disabled={isLoading || !isConfigured}
            className="w-full gap-1.5 font-semibold shadow-xs"
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            Execute Model Request
          </Button>
        </div>

        {/* Right Output: Real LLM Response Output */}
        <div className="lg:col-span-6 flex flex-col space-y-3">
          <div className="flex items-center justify-between p-2.5 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">Live Provider Output</span>
            </div>

            {response && (
              <div className="flex items-center gap-2">
                <Button size="iconSm" variant="ghost" onClick={handleCopy} title="Copy Output">
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
              </div>
            )}
          </div>

          {response && (
            <div className="flex items-center gap-3 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-md text-[11px] font-mono text-zinc-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> {response.latencyMs}ms
              </span>
              <span>•</span>
              <span>
                Prompt: {response.promptTokens} | Compl: {response.completionTokens} | Total:{" "}
                {response.totalTokens}
              </span>
              {response.estimatedCost !== undefined && (
                <>
                  <span>•</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    ${response.estimatedCost.toFixed(5)}
                  </span>
                </>
              )}
            </div>
          )}

          <div className="flex-1 min-h-[460px] p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 font-mono text-xs whitespace-pre-wrap leading-relaxed shadow-2xs overflow-y-auto">
            {response?.content || (
              <span className="text-zinc-400 italic">
                {isLoading ? "Awaiting response from AI model..." : "Model output will appear here after execution."}
              </span>
            )}
          </div>

          {response?.testId && (
            <div className="flex items-center gap-2 p-2 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs text-zinc-500">
              <span>Rate this model response:</span>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleRate(response.testId, star)}
                  className="hover:text-amber-500 text-zinc-300 dark:text-zinc-700"
                >
                  <Star className="w-4 h-4" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
