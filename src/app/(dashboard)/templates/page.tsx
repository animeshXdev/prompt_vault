import React from "react";
import prisma from "@/lib/db";
import { TemplatesClient } from "./templates-client";

export default async function TemplatesPage() {
  const [templates, workspaces] = await Promise.all([
    prisma.promptTemplate.findMany({
      where: { isArchived: false },
      orderBy: { updatedAt: "desc" },
      include: {
        workspace: { select: { name: true } },
        variables: { orderBy: { orderIndex: "asc" } },
        _count: { select: { presets: true } },
      },
    }),
    prisma.workspace.findMany({
      where: { isArchived: false },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="max-w-6xl mx-auto">
      <TemplatesClient templates={templates as any} workspaces={workspaces} />
    </div>
  );
}
