"use server";

import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { executeAIRequest, type AICompletionResponse } from "@/lib/ai/service";
import { logActivity } from "@/lib/activity";

export async function optimizePromptWithAIAction(
  promptText: string,
  mode: "clarity" | "structure" | "grammar" | "critique" | "generate_title" | "suggest_tags",
  provider = "openai",
  model?: string
): Promise<AICompletionResponse> {
  await requireAuth();

  let systemPrompt = "You are an elite prompt engineering expert.";
  let userInstruction = "";

  switch (mode) {
    case "clarity":
      userInstruction = `Rewrite the following AI prompt to make it significantly clearer, more precise, and direct, removing ambiguity while retaining the original intent:\n\n${promptText}`;
      break;
    case "structure":
      userInstruction = `Restructure the following AI prompt using standard professional prompt formatting: Role, Context, Task, Constraints, and Output Format:\n\n${promptText}`;
      break;
    case "grammar":
      userInstruction = `Correct any spelling, grammatical issues, and phrasing awkwardness in this prompt without changing its semantic meaning:\n\n${promptText}`;
      break;
    case "critique":
      userInstruction = `Analyze the following prompt. Point out any ambiguities, potential failure modes with LLMs, missing context or constraints, and provide 3 concrete suggestions for improvement:\n\n${promptText}`;
      break;
    case "generate_title":
      userInstruction = `Generate 5 concise, highly descriptive titles (under 6 words each) suitable for cataloging this prompt in a library:\n\n${promptText}`;
      break;
    case "suggest_tags":
      userInstruction = `List 5 to 8 lowercase comma-separated tags suitable for indexing this prompt (e.g. coding, typescript, summary, architecture):\n\n${promptText}`;
      break;
  }

  const result = await executeAIRequest({
    provider: provider as any,
    model,
    systemPrompt,
    userPrompt: userInstruction,
    maxTokens: 1500,
  });

  if (result.success) {
    await logActivity({ action: "ai_prompt_optimized", entityType: "ai", details: { mode, provider } });
  }

  return result;
}

export async function runPlaygroundTestAction(params: {
  promptId?: string;
  provider: "openai" | "anthropic" | "gemini" | "openrouter" | "ollama";
  model?: string;
  systemPrompt?: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
}): Promise<AICompletionResponse & { testId?: string }> {
  await requireAuth();

  const res = await executeAIRequest({
    provider: params.provider,
    model: params.model,
    systemPrompt: params.systemPrompt,
    userPrompt: params.userPrompt,
    temperature: params.temperature,
    maxTokens: params.maxTokens,
  });

  if (res.success && res.content) {
    try {
      const savedTest = await prisma.aITestResult.create({
        data: {
          promptId: params.promptId || null,
          provider: params.provider,
          model: params.model || "default",
          inputPrompt: params.systemPrompt ? `${params.systemPrompt}\n\n---\n\n${params.userPrompt}` : params.userPrompt,
          outputResponse: res.content,
          promptTokens: res.promptTokens || null,
          completionTokens: res.completionTokens || null,
          totalTokens: res.totalTokens || null,
          estimatedCost: res.estimatedCost || null,
          latencyMs: res.latencyMs || null,
        },
      });

      return { ...res, testId: savedTest.id };
    } catch (saveErr) {
      console.error("Failed to save AI test record:", saveErr);
    }
  }

  return res;
}

export async function rateAITestResultAction(
  testId: string,
  rating: number,
  notes?: string
): Promise<{ success: boolean }> {
  await requireAuth();

  await prisma.aITestResult.update({
    where: { id: testId },
    data: {
      rating,
      notes: notes || null,
    },
  });

  return { success: true };
}
