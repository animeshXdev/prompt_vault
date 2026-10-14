import React from "react";
import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import { TemplateRunnerClient } from "./template-runner-client";

export default async function TemplateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const template = await prisma.promptTemplate.findUnique({
    where: { id },
    include: {
      workspace: { select: { id: true, name: true } },
      variables: { orderBy: { orderIndex: "asc" } },
      presets: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!template) {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto">
      <TemplateRunnerClient template={template as any} />
    </div>
  );
}
