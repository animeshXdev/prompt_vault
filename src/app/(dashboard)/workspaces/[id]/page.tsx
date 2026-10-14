import React from "react";
import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import { WorkspaceHubClient } from "./workspace-hub-client";

export default async function WorkspaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const workspace = await prisma.workspace.findUnique({
    where: { id },
    include: {
      prompts: {
        where: { isDeleted: false },
        orderBy: { updatedAt: "desc" },
        include: {
          folder: true,
          category: true,
          promptTags: { include: { tag: true } },
        },
      },
      folders: {
        orderBy: { name: "asc" },
      },
      templates: {
        orderBy: { title: "asc" },
      },
      reusableRules: {
        orderBy: [{ priority: "desc" }, { title: "asc" }],
      },
      attachments: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!workspace) {
    notFound();
  }

  return (
    <div className="max-w-6xl mx-auto">
      <WorkspaceHubClient workspace={workspace} />
    </div>
  );
}
