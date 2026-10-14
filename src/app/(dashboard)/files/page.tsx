import React from "react";
import prisma from "@/lib/db";
import { FilesClient } from "./files-client";

export default async function FilesPage() {
  const [files, prompts, workspaces] = await Promise.all([
    prisma.attachment.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        prompt: { select: { id: true, title: true } },
        workspace: { select: { id: true, name: true } },
      },
    }),
    prisma.prompt.findMany({
      where: { isDeleted: false },
      select: { id: true, title: true },
    }),
    prisma.workspace.findMany({
      where: { isArchived: false },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="max-w-6xl mx-auto">
      <FilesClient
        files={files as any}
        prompts={prompts}
        workspaces={workspaces}
      />
    </div>
  );
}
