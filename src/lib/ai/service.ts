import prisma from "@/lib/db";
import { decryptSecret } from "@/lib/security/crypto";

export interface AICompletionRequest {
  provider: "openai" | "anthropic" | "gemini" | "openrouter" | "ollama";
  model?: string;
  systemPrompt?: string;
  userPrompt: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AICompletionResponse {
  success: boolean;
  content?: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  estimatedCost?: number;
  latencyMs?: number;
  error?: string;
  configured: boolean;
}

// Approximate cost per 1M tokens (input / output)
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  "gpt-4o": { input: 2.5, output: 10.0 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "claude-3-7-sonnet": { input: 3.0, output: 15.0 },
  "claude-3-5-haiku": { input: 0.8, output: 4.0 },
  "gemini-2.5-pro": { input: 1.25, output: 5.0 },
  "gemini-2.5-flash": { input: 0.075, output: 0.3 },
};

export async function getProviderConfig(provider: string) {
  const config = await prisma.aIProviderConfiguration.findUnique({
    where: { provider },
  });

  if (!config || !config.isEnabled) {
    return null;
  }

  let decryptedKey = "";
  if (config.encryptedApiKey) {
    try {
      decryptedKey = decryptSecret(config.encryptedApiKey);
    } catch {
      console.error(`Failed to decrypt API key for provider ${provider}`);
      return null;
    }
  }

  return {
    ...config,
    apiKey: decryptedKey,
  };
}

export async function executeAIRequest(req: AICompletionRequest): Promise<AICompletionResponse> {
  const config = await getProviderConfig(req.provider);

  if (!config) {
    return {
      success: false,
      configured: false,
      error: `Provider '${req.provider}' is not configured or disabled. Please enable and configure it in Settings → AI Providers.`,
    };
  }

  if (req.provider !== "ollama" && !config.apiKey) {
    return {
      success: false,
      configured: false,
      error: `API key for '${req.provider}' is missing. Please configure it in Settings → AI Providers.`,
    };
  }

  const startTime = Date.now();
  const model = req.model || config.defaultModel || getDefaultModel(req.provider);

  try {
    let result: { content: string; promptTokens: number; completionTokens: number };

    switch (req.provider) {
      case "openai":
      case "openrouter":
        result = await callOpenAICompatible(config.baseUrl || (req.provider === "openrouter" ? "https://openrouter.ai/api/v1" : "https://api.openai.com/v1"), config.apiKey, model, req);
        break;
      case "anthropic":
        result = await callAnthropic(config.apiKey, model, req);
        break;
      case "gemini":
        result = await callGemini(config.apiKey, model, req);
        break;
      case "ollama":
        result = await callOllama(config.baseUrl || "http://localhost:11434", model, req);
        break;
      default:
        throw new Error(`Unsupported provider: ${req.provider}`);
    }

    const latencyMs = Date.now() - startTime;
    const totalTokens = result.promptTokens + result.completionTokens;
    const pricing = MODEL_PRICING[model];
    let estimatedCost: number | undefined;

    if (pricing) {
      estimatedCost = (result.promptTokens / 1_000_000) * pricing.input + (result.completionTokens / 1_000_000) * pricing.output;
    }

    return {
      success: true,
      configured: true,
      content: result.content,
      promptTokens: result.promptTokens,
      completionTokens: result.completionTokens,
      totalTokens,
      estimatedCost,
      latencyMs,
    };
  } catch (error: any) {
    console.error(`AI execution error (${req.provider}):`, error);
    return {
      success: false,
      configured: true,
      error: error.message || "Failed to communicate with AI provider API",
      latencyMs: Date.now() - startTime,
    };
  }
}

function getDefaultModel(provider: string): string {
  switch (provider) {
    case "openai": return "gpt-4o-mini";
    case "anthropic": return "claude-3-5-haiku";
    case "gemini": return "gemini-2.5-flash";
    case "openrouter": return "openai/gpt-4o-mini";
    case "ollama": return "llama3";
    default: return "default";
  }
}

async function callOpenAICompatible(
  baseUrl: string,
  apiKey: string,
  model: string,
  req: AICompletionRequest
) {
  const url = `${baseUrl.replace(/\/+$/, "")}/chat/completions`;
  const messages: any[] = [];
  if (req.systemPrompt) {
    messages.push({ role: "system", content: req.systemPrompt });
  }
  messages.push({ role: "user", content: req.userPrompt });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: req.maxTokens || 2048,
      temperature: req.temperature ?? 0.7,
    }),
    signal: controller.signal,
  }).finally(() => clearTimeout(timeoutId));

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "";
  const promptTokens = data.usage?.prompt_tokens || 0;
  const completionTokens = data.usage?.completion_tokens || 0;

  return { content, promptTokens, completionTokens };
}

async function callAnthropic(apiKey: string, model: string, req: AICompletionRequest) {
  const url = "https://api.anthropic.com/v1/messages";
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      system: req.systemPrompt || undefined,
      messages: [{ role: "user", content: req.userPrompt }],
      max_tokens: req.maxTokens || 2048,
      temperature: req.temperature ?? 0.7,
    }),
    signal: controller.signal,
  }).finally(() => clearTimeout(timeoutId));

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Anthropic API error (${response.status}): ${err}`);
  }

  const data = await response.json();
  const content = data.content?.[0]?.text || "";
  const promptTokens = data.usage?.input_tokens || 0;
  const completionTokens = data.usage?.output_tokens || 0;

  return { content, promptTokens, completionTokens };
}

async function callGemini(apiKey: string, model: string, req: AICompletionRequest) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  const contents: any[] = [];
  if (req.systemPrompt) {
    contents.push({ role: "user", parts: [{ text: `System Instruction: ${req.systemPrompt}` }] });
  }
  contents.push({ role: "user", parts: [{ text: req.userPrompt }] });

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents,
      generationConfig: {
        maxOutputTokens: req.maxTokens || 2048,
        temperature: req.temperature ?? 0.7,
      },
    }),
    signal: controller.signal,
  }).finally(() => clearTimeout(timeoutId));

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${err}`);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const promptTokens = data.usageMetadata?.promptTokenCount || 0;
  const completionTokens = data.usageMetadata?.candidatesTokenCount || 0;

  return { content, promptTokens, completionTokens };
}

async function callOllama(baseUrl: string, model: string, req: AICompletionRequest) {
  const url = `${baseUrl.replace(/\/+$/, "")}/api/generate`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  const promptText = req.systemPrompt ? `${req.systemPrompt}\n\n${req.userPrompt}` : req.userPrompt;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      prompt: promptText,
      stream: false,
    }),
    signal: controller.signal,
  }).finally(() => clearTimeout(timeoutId));

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Ollama API error (${response.status}): ${err}`);
  }

  const data = await response.json();
  return {
    content: data.response || "",
    promptTokens: data.prompt_eval_count || 0,
    completionTokens: data.eval_count || 0,
  };
}
