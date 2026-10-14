import React from "react";
import prisma from "@/lib/db";
import { MasterPromptsClient } from "./master-prompts-client";

export default async function MasterPromptsPage() {
  const [masterPrompts, reusableRules, workspaces] = await Promise.all([
    prisma.masterPrompt.findMany({
      orderBy: [{ isGlobal: "desc" }, { createdAt: "desc" }],
      include: { workspace: { select: { name: true } } },
    }),
    prisma.reusableRule.findMany({
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      include: { workspace: { select: { name: true } } },
    }),
    prisma.workspace.findMany({
      where: { isArchived: false },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="max-w-6xl mx-auto">
      <MasterPromptsClient
        masterPrompts={masterPrompts as any}
        reusableRules={reusableRules as any}
        workspaces={workspaces}
      />
    </div>
  );
}
