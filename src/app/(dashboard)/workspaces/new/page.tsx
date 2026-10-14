"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Briefcase, Save, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { workspaceSchema, type WorkspaceInput } from "@/lib/validations/organization";
import { createWorkspaceAction } from "@/features/workspaces/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function NewWorkspacePage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<WorkspaceInput>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: {
      name: "",
      description: "",
      projectType: "Next.js Development",
      technologyStack: "Next.js, TypeScript, Tailwind CSS, SQLite",
      customInstructions: "",
      masterPrompt: "",
    },
  });

  const onSubmit = (data: WorkspaceInput) => {
    startTransition(async () => {
      const res = await createWorkspaceAction(data);
      if (res.success && res.workspaceId) {
        toast.success("Workspace created successfully");
        router.push(`/workspaces/${res.workspaceId}`);
      } else {
        toast.error(res.error || "Failed to create workspace");
      }
    });
  };

  const commonTypes = [
    "Next.js Development",
    "Laravel Development",
    "Flutter Development",
    "API Development",
    "UI/UX Design",
    "Business Requirements",
    "General AI Prompts",
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="iconSm">
            <Link href="/workspaces">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Create Project Workspace
            </h1>
            <p className="text-xs text-zinc-500">
              Set up dedicated context, coding standards, and master instructions for a project.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="ws-name">Workspace Name *</Label>
            <Input
              id="ws-name"
              placeholder="e.g. PromptVault SaaS Platform"
              {...register("name")}
            />
            {errors.name && <p className="text-[11px] text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ws-type">Project Type</Label>
            <Input
              id="ws-type"
              placeholder="e.g. Next.js Development"
              list="project-types"
              {...register("projectType")}
            />
            <datalist id="project-types">
              {commonTypes.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ws-stack">Technology Stack</Label>
            <Input
              id="ws-stack"
              placeholder="e.g. Next.js 16, TypeScript, Tailwind 4, SQLite, Prisma"
              {...register("technologyStack")}
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="ws-desc">Description</Label>
            <Input
              id="ws-desc"
              placeholder="Brief description of the workspace purpose and team context..."
              {...register("description")}
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="ws-instructions">Workspace Custom Instructions & Constraints</Label>
            <Textarea
              id="ws-instructions"
              rows={4}
              placeholder="Specific architectural rules, coding standards, styling conventions, or output instructions..."
              {...register("customInstructions")}
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="ws-master">Workspace Master System Prompt</Label>
            <Textarea
              id="ws-master"
              rows={5}
              placeholder="You are an expert full-stack developer working on this project. Always adhere to..."
              {...register("masterPrompt")}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <Button asChild variant="outline" size="sm">
            <Link href="/workspaces">Cancel</Link>
          </Button>
          <Button type="submit" size="sm" disabled={isPending} className="gap-1.5 font-semibold">
            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Create Workspace
          </Button>
        </div>
      </form>
    </div>
  );
}
