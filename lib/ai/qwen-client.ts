const DEFAULT_BASE_URL =
  "https://dashscope-intl.aliyuncs.com/compatible-mode/v1";

function env(name: string): string {
  return process.env[name]?.trim() ?? "";
}

export function isQwenConfigured(): boolean {
  return Boolean(env("QWEN_API_KEY"));
}

function getApiKey(): string {
  const key = env("QWEN_API_KEY");
  if (!key) throw new Error("QWEN_API_KEY tidak terkonfigurasi.");
  return key;
}

function getBaseUrl(): string {
  return env("QWEN_BASE_URL") || DEFAULT_BASE_URL;
}

function getDefaultModel(): string {
  return env("QWEN_CHAT_MODEL") || "qwen-plus";
}

export type QwenMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type QwenChatBody = {
  model: string;
  messages: QwenMessage[];
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: "json_object" };
  stream?: false;
};

type QwenChatResponse = {
  choices?: { message?: { content?: string }; finish_reason?: string }[];
  error?: { message?: string };
};

async function callQwenChat(body: QwenChatBody): Promise<string> {
  const res = await fetch(`${getBaseUrl()}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as QwenChatResponse;
  if (!res.ok) {
    const message = json?.error?.message ?? `Qwen HTTP ${res.status}`;
    const err = new Error(`Qwen failed: ${message}`);
    (err as { status?: number }).status = res.status;
    throw err;
  }
  const text = json.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("Qwen tidak mengembalikan respons.");
  return text;
}

export async function generateQwenChat({
  systemInstruction,
  userMessage,
  history = [],
  model = getDefaultModel(),
  temperature = 0.6,
  maxTokens = 600,
}: {
  systemInstruction: string;
  userMessage: string;
  history?: QwenMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
}): Promise<string> {
  return callQwenChat({
    model,
    messages: [
      { role: "system", content: systemInstruction },
      ...history,
      { role: "user", content: userMessage },
    ],
    temperature,
    max_tokens: maxTokens,
  });
}

export async function generateQwenJson<T = unknown>({
  prompt,
  systemInstruction,
  model = getDefaultModel(),
  temperature = 0.45,
  maxTokens = 1200,
}: {
  prompt: string;
  systemInstruction: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}): Promise<T> {
  const text = await callQwenChat({
    model,
    messages: [
      { role: "system", content: systemInstruction },
      { role: "user", content: prompt },
    ],
    temperature,
    max_tokens: maxTokens,
    response_format: { type: "json_object" },
  });
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("Qwen mengembalikan JSON tidak valid.");
  }
}

export function shouldFallbackToQwen(error: unknown): boolean {
  if (!isQwenConfigured()) return false;
  const status = (error as { status?: number })?.status;
  const text = String(error);
  return (
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    /RESOURCE_EXHAUSTED|UNAVAILABLE|high demand|quota|exhausted/i.test(text)
  );
}

function getEmbedModel(): string {
  return env("QWEN_EMBED_MODEL") || "text-embedding-v4";
}

type QwenEmbedResponse = {
  data?: { embedding?: number[] }[];
  error?: { message?: string };
};

export async function embedTextQwen(
  text: string,
  outputDim = 768,
): Promise<number[]> {
  const trimmed = text.trim();
  if (!trimmed) throw new Error("embedTextQwen: text kosong");
  const res = await fetch(`${getBaseUrl()}/embeddings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({
      model: getEmbedModel(),
      input: trimmed,
      dimensions: outputDim,
      encoding_format: "float",
    }),
  });
  const json = (await res.json()) as QwenEmbedResponse;
  if (!res.ok) {
    const message = json?.error?.message ?? `Qwen embed HTTP ${res.status}`;
    const err = new Error(`Qwen embed failed: ${message}`);
    (err as { status?: number }).status = res.status;
    throw err;
  }
  const values = json.data?.[0]?.embedding;
  if (!values || values.length !== outputDim) {
    throw new Error(
      `Qwen embed: unexpected length ${values?.length ?? 0}, expected ${outputDim}`,
    );
  }
  let sumSq = 0;
  for (const x of values) sumSq += x * x;
  const norm = Math.sqrt(sumSq);
  if (norm === 0) return values;
  return values.map((x) => x / norm);
}

export async function embedTextsQwen(
  texts: string[],
  outputDim = 768,
): Promise<number[][]> {
  if (texts.length === 0) return [];
  if (texts.length > 10) {
    throw new Error(`embedTextsQwen: batch max 10, got ${texts.length}`);
  }
  const cleaned = texts.map((t) => t.trim());
  if (cleaned.some((t) => !t)) {
    throw new Error("embedTextsQwen: salah satu text kosong");
  }
  const res = await fetch(`${getBaseUrl()}/embeddings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({
      model: getEmbedModel(),
      input: cleaned,
      dimensions: outputDim,
      encoding_format: "float",
    }),
  });
  const json = (await res.json()) as QwenEmbedResponse;
  if (!res.ok) {
    const message = json?.error?.message ?? `Qwen embed HTTP ${res.status}`;
    const err = new Error(`Qwen embed failed: ${message}`);
    (err as { status?: number }).status = res.status;
    throw err;
  }
  const data = json.data ?? [];
  if (data.length !== cleaned.length) {
    throw new Error(
      `Qwen embed batch: expected ${cleaned.length} embeddings, got ${data.length}`,
    );
  }
  return data.map((d, i) => {
    const values = d.embedding;
    if (!values || values.length !== outputDim) {
      throw new Error(
        `Qwen embed batch[${i}]: unexpected length ${values?.length ?? 0}`,
      );
    }
    let sumSq = 0;
    for (const x of values) sumSq += x * x;
    const norm = Math.sqrt(sumSq);
    if (norm === 0) return values;
    return values.map((x) => x / norm);
  });
}
