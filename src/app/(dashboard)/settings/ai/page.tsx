import React from "react";
import prisma from "@/lib/db";
import { AiSettingsClient } from "./ai-settings-client";

export default async function AiSettingsPage() {
  const dbConfigs = await prisma.aIProviderConfiguration.findMany();

  const configs = dbConfigs.map((c) => ({
    provider: c.provider,
    isEnabled: c.isEnabled,
    hasKey: !!c.encryptedApiKey,
    baseUrl: c.baseUrl,
    defaultModel: c.defaultModel,
  }));

  return <AiSettingsClient configs={configs} />;
}
