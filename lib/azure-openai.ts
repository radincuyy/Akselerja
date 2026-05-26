const DEFAULT_API_VERSION = "2024-10-21";

export type AzureOpenAiMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type AzureOpenAiJsonRequest = {
  messages: AzureOpenAiMessage[];
  temperature?: number;
  maxTokens?: number;
};

function env(name: string): string {
  return process.env[name]?.trim() ?? "";
}

function endpoint(): string {
  return env("AZURE_OPENAI_ENDPOINT");
}

function apiKey(): string {
  return env("AZURE_OPENAI_KEY") || env("AZURE_OPENAI_API_KEY");
}

function deployment(): string {
  return (
    env("AZURE_OPENAI_DEPLOYMENT_CHAT") ||
    env("AZURE_OPENAI_CHAT_DEPLOYMENT")
  );
}

function apiVersion(): string {
  return env("AZURE_OPENAI_API_VERSION") || DEFAULT_API_VERSION;
}

function normalizeEndpoint(value: string): string {
  return value.replace(/\/+$/, "");
}

export function isAzureOpenAiConfigured(): boolean {
  return Boolean(endpoint() && apiKey() && deployment());
}

function parseJsonObject(text: string): unknown {
  const trimmed = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new Error("Azure OpenAI returned non-JSON content.");
  }
}

export async function generateAzureOpenAiJson<T = unknown>({
  messages,
  temperature = 0.45,
  maxTokens = 900,
}: AzureOpenAiJsonRequest): Promise<T> {
  if (!isAzureOpenAiConfigured()) {
    throw new Error("Azure OpenAI is not configured.");
  }

  const url = `${normalizeEndpoint(endpoint())}/openai/deployments/${encodeURIComponent(
    deployment(),
  )}/chat/completions?api-version=${encodeURIComponent(apiVersion())}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey(),
    },
    body: JSON.stringify({
      messages,
      temperature,
      max_tokens: maxTokens,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(
      `Azure OpenAI failed: ${res.status} ${detail.slice(0, 240)}`,
    );
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("Azure OpenAI returned an empty response.");
  return parseJsonObject(content) as T;
}
