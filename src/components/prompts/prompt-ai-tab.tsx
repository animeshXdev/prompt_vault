"use client";

import React, { useState } from "react";
import { Play, Sparkles, Star, Loader2, Clock, Coins, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { runPlaygroundTestAction, rateAITestResultAction } from "@/features/ai/actions";

interface AITestRecord {
  id: string;
  provider: string;
  model: string;
  outputResponse: string;
  totalTokens?: number | null;
  estimatedCost?: number | null;
  latencyMs?: number | null;
  rating?: number | null;
  createdAt: Date | string;
}

export function PromptAiTab({
  promptId,
  promptContent,
  history = [],
}: {
  promptId: string;
  promptContent: string;
  history: AITestRecord[];
}) {
  const [provider, setProvider] = useState<"openai" | "anthropic" | "gemini" | "ollama">("openai");
  const [model, setModel] = useState("gpt-4o-mini");
  const [temperature, setTemperature] = useState(0.7);
  const [isLoading, setIsLoading] = useState(false);
  const [currentResponse, setCurrentResponse] = useState<any | null>(null);

  const handleRunTest = async () => {
    if (!promptContent.trim()) {
      toast.error("Prompt content is empty");
      return;
    }

    setIsLoading(true);
    setCurrentResponse(null);

    try {
      const res = await runPlaygroundTestAction({
        promptId,
        provider,
        model,
        userPrompt: promptContent,
        temperature,
      });

      if (res.success) {
        setCurrentResponse(res);
        toast.success(`Completed in ${res.latencyMs}ms`);
      } else {
        toast.error(res.error || "AI provider returned an error");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to execute AI request");
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

  return (
    <div className="space-y-4">
      {/* Test Controls Header */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs">
        <div>
          <label className="text-[11px] font-semibold text-zinc-500 block mb-1">Provider</label>
          <select
            value={provider}
            onChange={(e) => {
              const p = e.target.value as any;
              setProvider(p);
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
            <option value="ollama">Ollama (Local)</option>
          </select>
        </div>

        <div>
          <label className="text-[11px] font-semibold text-zinc-500 block mb-1">Model</label>
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full h-8 px-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-mono"
            placeholder="Model identifier..."
          />
        </div>

        <div>
          <label className="text-[11px] font-semibold text-zinc-500 block mb-1">
            Temperature: {temperature}
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={temperature}
            onChange={(e) => setTemperature(parseFloat(e.target.value))}
            className="w-full mt-2"
          />
        </div>

        <div className="flex items-end">
          <Button
            size="sm"
            onClick={handleRunTest}
            disabled={isLoading}
            className="w-full gap-1.5 font-semibold shadow-xs"
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            Execute Prompt Test
          </Button>
        </div>
      </div>

      {/* Real-time Response Output */}
      {currentResponse && (
        <div className="border border-indigo-200 dark:border-indigo-900/60 rounded-lg p-4 bg-indigo-50/20 dark:bg-indigo-950/20 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-indigo-200/60 dark:border-indigo-900/40 text-xs">
            <span className="font-semibold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              Model Response ({model})
            </span>
            <div className="flex items-center gap-3 font-mono text-[11px] text-zinc-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-zinc-400" />
                {currentResponse.latencyMs}ms
              </span>
              <span>{currentResponse.totalTokens} tokens</span>
              {currentResponse.estimatedCost !== undefined && (
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <Coins className="w-3 h-3" />${currentResponse.estimatedCost.toFixed(5)}
                </span>
              )}
            </div>
          </div>

          <div className="font-mono text-xs text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
            {currentResponse.content}
          </div>

          {currentResponse.testId && (
            <div className="flex items-center gap-2 pt-2 text-xs text-zinc-500">
              <span>Rate this output:</span>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleRate(currentResponse.testId, star)}
                  className="hover:text-amber-500 text-zinc-300 dark:text-zinc-700"
                >
                  <Star className="w-4 h-4" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Historical Test Executions */}
      {history.length > 0 && (
        <div className="space-y-2 pt-4">
          <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Past Playground Test Runs ({history.length})
          </h4>
          <div className="space-y-2">
            {history.map((t) => (
              <div
                key={t.id}
                className="p-3 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs space-y-1.5 bg-white dark:bg-zinc-900/40"
              >
                <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                  <span>
                    {t.provider} / {t.model}
                  </span>
                  <span>{t.latencyMs}ms • {t.totalTokens || 0} tok</span>
                </div>
                <div className="font-mono text-[11px] text-zinc-700 dark:text-zinc-300 line-clamp-3 whitespace-pre-wrap">
                  {t.outputResponse}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
