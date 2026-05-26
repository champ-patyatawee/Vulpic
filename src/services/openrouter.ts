import type { ModelId } from "../types/model";

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
