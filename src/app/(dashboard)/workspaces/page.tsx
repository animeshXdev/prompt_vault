import React from "react";
import prisma from "@/lib/db";
import { WorkspacesClient } from "./workspaces-client";

export default async function WorkspacesPage() {
  const workspaces = await prisma.workspace.findMany({
    orderBy: [{ isArchived: "asc" }, { name: "asc" }],
    include: {
      _count: {
        select: {
          prompts: { where: { isDeleted: false } },
          folders: true,
          templates: true,
        },
      },
    },
  });

  return (
    <div className="max-w-6xl mx-auto">
      <WorkspacesClient workspaces={workspaces as any} />
    </div>
  );
}
