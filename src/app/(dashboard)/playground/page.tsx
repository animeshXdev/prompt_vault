import React from "react";
import prisma from "@/lib/db";
import { PlaygroundClient } from "./playground-client";

export default async function PlaygroundPage() {
  const [providerConfigs, history] = await Promise.all([
    prisma.aIProviderConfiguration.findMany({
      select: {
        provider: true,
        isEnabled: true,
        encryptedApiKey: true,
        defaultModel: true,
      },
    }),
    prisma.aITestResult.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const providerSummaries = [
    { provider: "openai", defaultModel: "gpt-4o-mini" },
    { provider: "anthropic", defaultModel: "claude-3-5-haiku" },
    { provider: "gemini", defaultModel: "gemini-2.5-flash" },
    { provider: "openrouter", defaultModel: "openai/gpt-4o-mini" },
    { provider: "ollama", defaultModel: "llama3" },
  ].map((base) => {
    const config = providerConfigs.find((c) => c.provider === base.provider);
    return {
      provider: base.provider,
      isEnabled: config ? config.isEnabled : base.provider === "ollama",
      hasKey: !!config?.encryptedApiKey,
      defaultModel: config?.defaultModel || base.defaultModel,
    };
  });

  return (
    <div className="max-w-7xl mx-auto">
      <PlaygroundClient providers={providerSummaries} history={history} />
    </div>
  );
}
