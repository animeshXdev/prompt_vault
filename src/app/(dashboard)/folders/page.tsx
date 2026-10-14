import React from "react";
import prisma from "@/lib/db";
import { FoldersClient } from "./folders-client";

export default async function FoldersPage() {
  const folders = await prisma.folder.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { prompts: { where: { isDeleted: false } } },
      },
    },
  });

  return (
    <div className="max-w-6xl mx-auto">
      <FoldersClient folders={folders} />
    </div>
  );
}
