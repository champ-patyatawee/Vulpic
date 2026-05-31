export interface AIModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  pricing: string;
  capabilities: ("image-generation" | "image-editing" | "image-qna")[];
}

export const AVAILABLE_MODELS: AIModel[] = [
  {
    id: "openai/gpt-5.4-image-2",
    name: "GPT-5.4 Image 2",
    provider: "OpenAI",
    description: "Latest GPT-5.4 with state-of-the-art image generation, editing, and multimodal reasoning",
    pricing: "$8/$15 per 1M tokens",
    capabilities: ["image-generation", "image-editing", "image-qna"],
  },
  {
    id: "bytedance-seed/seedream-4.5",
    name: "Seedream 4.5",
    provider: "ByteDance",
    description: "Latest in-house image generation model. Excellent editing consistency, portrait and text rendering",
    pricing: "$0.04 per image",
    capabilities: ["image-generation", "image-editing"],
  },
  {
    id: "google/gemini-2.5-flash-image",
    name: "Nano Banana (Gemini 2.5 Flash)",
    provider: "Google",
    description: "Fast and efficient image generation. Optimized for high-volume, low-latency tasks",
    pricing: "Free tier / pay-as-you-go",
    capabilities: ["image-generation", "image-editing"],
  },
  {
    id: "google/gemini-3.1-flash-image-preview",
    name: "Nano Banana 2 (Gemini 3.1 Flash)",
    provider: "Google",
    description: "Pro-level visual quality at Flash speed. State-of-the-art image generation and editing",
    pricing: "$0.50/$3 per 1M tokens",
    capabilities: ["image-generation", "image-editing", "image-qna"],
  },
  {
    id: "google/gemini-3-pro-image-preview",
    name: "Nano Banana Pro (Gemini 3 Pro)",
    provider: "Google",
    description: "Higher quality image generation and editing with Gemini 3 Pro",
    pricing: "$2/$8 per 1M tokens",
    capabilities: ["image-generation", "image-editing", "image-qna"],
  },
  {
    id: "openai/gpt-5-image-mini",
    name: "GPT-5 Image Mini",
    provider: "OpenAI",
    description: "Fast, cost-effective image generation and editing",
    pricing: "$4/$8 per 1M tokens",
    capabilities: ["image-generation", "image-editing", "image-qna"],
  },
  {
    id: "openai/gpt-5-image",
    name: "GPT-5 Image",
    provider: "OpenAI",
    description: "Original GPT-5 with image generation and editing capabilities",
    pricing: "$5/$10 per 1M tokens",
    capabilities: ["image-generation", "image-editing", "image-qna"],
  },
  {
    id: "openrouter/auto",
    name: "Auto Router",
    provider: "OpenRouter",
    description: "Automatically routes to the best available image generation model for your prompt",
    pricing: "Varies by model",
    capabilities: ["image-generation", "image-editing", "image-qna"],
  },
];

export const TEXT_MODELS: AIModel[] = [
  {
    id: "openai/gpt-4o",
    name: "GPT-4o",
    provider: "OpenAI",
    description: "Latest multimodal model — strong at prompt engineering & creative writing",
    pricing: "$2.50/$10 per 1M tokens",
    capabilities: ["image-generation", "image-editing", "image-qna"],
  },
  {
    id: "openai/gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "OpenAI",
    description: "Fast, affordable text generation — great for bulk prompt creation",
    pricing: "$0.15/$0.60 per 1M tokens",
    capabilities: ["image-generation", "image-editing", "image-qna"],
  },
  {
    id: "anthropic/claude-3.5-sonnet",
    name: "Claude 3.5 Sonnet",
    provider: "Anthropic",
    description: "Excellent at following complex instructions and structured output",
    pricing: "$3/$15 per 1M tokens",
    capabilities: ["image-generation", "image-editing", "image-qna"],
  },
  {
    id: "google/gemini-2.0-flash-001",
    name: "Gemini 2.0 Flash",
    provider: "Google",
    description: "Fast, free-tier friendly text generation",
    pricing: "Free / $0.10/$0.40 per 1M tokens",
    capabilities: ["image-generation", "image-editing", "image-qna"],
  },
  {
    id: "meta-llama/llama-3.2-3b-instruct",
    name: "Llama 3.2 3B",
    provider: "Meta",
    description: "Lightweight open model for simple prompt generation tasks",
    pricing: "$0.06/$0.06 per 1M tokens",
    capabilities: ["image-generation", "image-editing", "image-qna"],
  },
];

/** Return models that are available with the given API keys */
export function getAvailableModels(
  openrouterKey: string,
): AIModel[] {
  // All models go through OpenRouter
  return !!openrouterKey ? AVAILABLE_MODELS : [];
}

export type ModelId = string;
