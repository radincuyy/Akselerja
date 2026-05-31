import { GoogleGenAI } from "@google/genai";
import {
  generateQwenJson,
  isQwenConfigured,
  shouldFallbackToQwen,
} from "./qwen-client";
import { isQuotaError, reserveGeminiCall } from "./ai-budget";

const DEFAULT_MODEL = process.env.GEMINI_CHAT_MODEL ?? "gemini-2.5-flash";

let _client: GoogleGenAI | null = null;

function env(name: string): string {
  return process.env[name]?.trim() ?? "";
}

function parseIntegerEnv(name: string, fallback: number): number {
  const parsed = Number.parseInt(env(name), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getClient(): GoogleGenAI {
  if (!_client) {
    const apiKey = env("GEMINI_API_KEY");
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY tidak terkonfigurasi.");
    }
    _client = new GoogleGenAI({ apiKey });
  }
  return _client;
}

export function isGeminiConfigured(): boolean {
  return Boolean(env("GEMINI_API_KEY"));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldRetry(error: unknown): boolean {
  const status = (error as { status?: number })?.status;
  const text = String(error);
  return (
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    /RESOURCE_EXHAUSTED|UNAVAILABLE|high demand|quota/i.test(text)
  );
}

export async function generateGeminiJson<T = unknown>({
  prompt,
  systemInstruction,
  responseSchema,
  model = DEFAULT_MODEL,
  temperature = 0.45,
  maxOutputTokens = 1200,
}: {
  prompt: string;
  systemInstruction: string;
  responseSchema: Record<string, unknown>;
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
}): Promise<T> {
  const attempts = Math.max(1, parseIntegerEnv("GEMINI_JSON_RETRIES", 3));
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      reserveGeminiCall();
      const response = await getClient().models.generateContent({
        model,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema,
          temperature,
          maxOutputTokens,
          thinkingConfig: {
            includeThoughts: false,
            thinkingBudget: parseIntegerEnv("GEMINI_JSON_THINKING_BUDGET", 0),
          },
        },
      });

      const text = response.text?.trim();
      if (!text) {
        throw new Error("Gemini tidak mengembalikan JSON.");
      }

      try {
        return JSON.parse(text) as T;
      } catch {
        throw new Error("Gemini mengembalikan JSON tidak valid.");
      }
    } catch (error) {
      lastError = error;
      if (isQuotaError(error)) break;
      if (attempt >= attempts - 1 || !shouldRetry(error)) break;
      await sleep(600 * (attempt + 1));
    }
  }

  if (
    isQwenConfigured() &&
    (isQuotaError(lastError) || shouldFallbackToQwen(lastError))
  ) {
    console.warn(
      "[gemini-json] Gemini exhausted, failing over to Qwen:",
      String(lastError).slice(0, 160),
    );
    return generateQwenJson<T>({
      prompt,
      systemInstruction,
      temperature,
      maxTokens: maxOutputTokens,
    });
  }

  throw lastError;
}
