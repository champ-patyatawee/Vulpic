import type { ModelId, AIModel } from "../types/model";

const BASE = "https://openrouter.ai/api/v1/chat/completions";

function buildUserMessage(text: string, imageDataUrls?: string[]) {
  const content: Array<
    | { type: "text"; text: string }
    | { type: "image_url"; image_url: { url: string } }
  > = [];

  if (imageDataUrls) {
    for (const url of imageDataUrls) {
      content.push({
        type: "image_url",
        image_url: { url },
      });
    }
  }

  if (text) {
    content.push({ type: "text", text });
  }

  return {
    role: "user" as const,
    content:
      content.length === 1 && content[0].type === "text"
        ? content[0].text
        : content,
  };
}

async function streamCompletion(
  apiKey: string,
  model: ModelId,
  text: string,
  imageDataUrls?: string[],
): Promise<string> {
  const response = await fetch(BASE, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://vulpic.app",
      "X-Title": "Vulpic",
    },
    body: JSON.stringify({
      model,
      messages: [buildUserMessage(text, imageDataUrls)],
      modalities: ["image"],
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "(unreadable)");
    throw new Error(
      `OpenRouter API error (${response.status}): ${errorText.slice(0, 500)}`,
    );
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("Response body is not readable");

  const decoder = new TextDecoder();
  let fullContent = "";
  let imageUrl = "";
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("data: ")) {
        const data = trimmed.slice(6);
        if (data === "[DONE]") break;

        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            throw new Error(
              `Model error: ${parsed.error.message ?? JSON.stringify(parsed.error)}`,
            );
          }
          const delta = parsed.choices?.[0]?.delta;
          if (delta?.content) fullContent += delta.content;
          // Some models (e.g. Seedream) return images in delta.images array
          if (delta?.images && Array.isArray(delta.images)) {
            for (const img of delta.images) {
              if (img.type === "image_url" && img.image_url?.url) {
                imageUrl = img.image_url.url;
              }
            }
          }
        } catch (e) {
          if (e instanceof SyntaxError) continue;
          throw e;
        }
      }
    }
  }

  // If we got an image from delta.images, return it
  if (imageUrl) return imageUrl;

  if (!fullContent) {
    throw new Error(
      `No response from OpenRouter. Model "${model}" returned an empty stream.`,
    );
  }

  return fullContent;
}

export async function generateImage(
  apiKey: string,
  model: ModelId,
  prompt: string,
): Promise<string> {
  const content = await streamCompletion(apiKey, model, prompt);
  return extractImageFromResponse(content);
}

export async function editImage(
  apiKey: string,
  model: ModelId,
  sourceImageDataUrl: string,
  prompt: string,
  extraImageDataUrls?: string[],
): Promise<string> {
  const imageDataUrls = [sourceImageDataUrl, ...(extraImageDataUrls ?? [])];
  const content = await streamCompletion(
    apiKey,
    model,
    prompt,
    imageDataUrls,
  );
  return extractImageFromResponse(content);
}

export async function queryImage(
  apiKey: string,
  model: ModelId,
  imageDataUrl: string,
  question: string,
): Promise<string> {
  return streamCompletion(apiKey, model, question, [imageDataUrl]);
}

function extractImageFromResponse(content: string): string {
  const trimmed = content.trim();

  if (trimmed.startsWith("data:image/")) return trimmed;

  const mdMatch = content.match(/!\[.*?\]\((https?:\/\/[^\s)]+)\)/);
  if (mdMatch) return mdMatch[1];

  const b64Match = content.match(/data:image\/[^;]+;base64,[a-zA-Z0-9+/=]+/);
  if (b64Match) return b64Match[0];

  const urlMatch = content.match(
    /(https?:\/\/[^\s"'\])]+\.(png|jpg|jpeg|gif|webp))/i,
  );
  if (urlMatch) return urlMatch[1];

  if (/^https?:\/\/\S+$/.test(trimmed)) return trimmed;

  throw new Error(
    `Model returned text instead of an image:\n${content.slice(0, 500)}`,
  );
}

/**
 * Generate text completion using a text model (for prompt template generation).
 */
export async function generateChatCompletion(
  apiKey: string,
  model: ModelId,
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  const response = await fetch(BASE, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://vulpic.app",
      "X-Title": "Vulpic",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "(unreadable)");
    throw new Error(`OpenRouter API error (${response.status}): ${errorText.slice(0, 500)}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? "";
}

const MODELS_CACHE = "vulpic-models-cache";
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Fetch all image-generation models from OpenRouter using the API key.
 * The ?output_modalities=image filter returns ALL image models (including
 * Seedream, Grok Imagine, FLUX, Recraft, etc.) — requires auth.
 */
export async function fetchImageModels(apiKey?: string): Promise<AIModel[]> {
  const cached = localStorage.getItem(MODELS_CACHE);
  if (cached) {
    try {
      const { data, ts } = JSON.parse(cached);
      if (Date.now() - ts < CACHE_TTL) return data;
    } catch { /* corrupt cache */ }
  }

  const res = await fetch("https://openrouter.ai/api/v1/models?output_modalities=image", {
    headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : undefined,
  });
  if (!res.ok) throw new Error(`OpenRouter API ${res.status}`);

  const body = await res.json();
  const items = body.data ?? body ?? [];

  const imageModels = items.map((m: any) => {
    const p = m.pricing ?? {};
    const cost = p.image != null
      ? `$${p.image}/image`
      : p.prompt != null
        ? `$${p.prompt} / $${p.completion ?? "?"} per 1M`
        : "Variable";
    const slug: string = m.id;
    const provider = slug.startsWith("openai/") ? "OpenAI"
      : slug.startsWith("google/") ? "Google"
      : slug.startsWith("bytedance-") ? "ByteDance"
      : slug.startsWith("x-ai/") ? "xAI"
      : slug.startsWith("openrouter/") ? "OpenRouter"
      : slug.startsWith("recraft/") ? "Recraft"
      : slug.startsWith("black-forest-labs/") ? "Black Forest Labs"
      : slug.startsWith("sourceful/") ? "Sourceful"
      : slug.split("/")[0] ?? "Other";
    return {
      id: m.id,
      name: m.name.replace(/^[^:]+:\s*/, ""),
      provider,
      description: m.description ?? "",
      pricing: cost,
      capabilities: ["image-generation" as const, "image-editing" as const, "image-qna" as const],
    };
  });

  localStorage.setItem(MODELS_CACHE, JSON.stringify({ data: imageModels, ts: Date.now() }));
  return imageModels;
}

const TEXT_MODELS_CACHE = "vulpic-text-models-cache";

/**
 * Fetch all text models from OpenRouter.
 * Uses the same API but without output_modalities filter to get all models.
 */
export async function fetchTextModels(apiKey?: string): Promise<AIModel[]> {
  const cached = localStorage.getItem(TEXT_MODELS_CACHE);
  if (cached) {
    try {
      const { data, ts } = JSON.parse(cached);
      if (Date.now() - ts < CACHE_TTL) return data;
    } catch { /* corrupt cache */ }
  }

  const res = await fetch("https://openrouter.ai/api/v1/models", {
    headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : undefined,
  });
  if (!res.ok) throw new Error(`OpenRouter API ${res.status}`);

  const body = await res.json();
  const items: any[] = body.data ?? body ?? [];

  const textModels = items.map((m: any) => {
    const p = m.pricing ?? {};
    const cost = p.prompt != null
      ? `$${p.prompt} / $${p.completion ?? "?"} per 1M`
      : "Variable";
    const slug: string = m.id;
    const provider = slug.startsWith("openai/") ? "OpenAI"
      : slug.startsWith("google/") ? "Google"
      : slug.startsWith("anthropic/") ? "Anthropic"
      : slug.startsWith("meta-llama/") ? "Meta"
      : slug.startsWith("mistralai/") ? "Mistral"
      : slug.startsWith("cohere/") ? "Cohere"
      : slug.startsWith("x-ai/") ? "xAI"
      : slug.startsWith("deepseek/") ? "DeepSeek"
      : slug.startsWith("openrouter/") ? "OpenRouter"
      : slug.split("/")[0] ?? "Other";
    return {
      id: m.id,
      name: m.name?.replace(/^[^:]+:\s*/, "") ?? slug,
      provider,
      description: m.description ?? "",
      pricing: cost,
      capabilities: ["image-generation" as const, "image-editing" as const, "image-qna" as const],
    };
  });

  localStorage.setItem(TEXT_MODELS_CACHE, JSON.stringify({ data: textModels, ts: Date.now() }));
  return textModels;
}
