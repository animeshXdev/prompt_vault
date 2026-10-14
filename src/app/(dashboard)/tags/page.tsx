import React from "react";
import prisma from "@/lib/db";
import { TagsClient } from "./tags-client";

export default async function TagsPage() {
  const tags = await prisma.tag.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { promptTags: true } },
    },
  });

  return (
    <div className="max-w-6xl mx-auto">
      <TagsClient tags={tags} />
    </div>
  );
}
