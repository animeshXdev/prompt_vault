import React from "react";
import prisma from "@/lib/db";
import { ComposerClient } from "./composer-client";

export default async function ComposerPage() {
  const [masterPrompts, reusableRules, savedPrompts, workspaces, compositions] = await Promise.all([
    prisma.masterPrompt.findMany({
      where: { isActive: true },
      orderBy: [{ isGlobal: "desc" }, { createdAt: "desc" }],
    }),
    prisma.reusableRule.findMany({
      where: { isEnabled: true },
      orderBy: [{ priority: "desc" }, { title: "asc" }],
    }),
    prisma.prompt.findMany({
      where: { isDeleted: false, isArchived: false },
      select: { id: true, title: true, content: true },
      orderBy: { updatedAt: "desc" },
      take: 50,
    }),
    prisma.workspace.findMany({
      where: { isArchived: false },
      select: { id: true, name: true, customInstructions: true, masterPrompt: true },
    }),
    prisma.promptComposition.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        blocks: { orderBy: { orderIndex: "asc" } },
      },
    }),
  ]);

  return (
    <div className="max-w-7xl mx-auto">
      <ComposerClient
        masterPrompts={masterPrompts}
        reusableRules={reusableRules}
        savedPrompts={savedPrompts}
        workspaces={workspaces}
        existingCompositions={compositions}
      />
    </div>
  );
}
