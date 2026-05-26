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
];

export type ModelId = (typeof AVAILABLE_MODELS)[number]["id"];
