export interface PromptTemplate {
  id: string;
  label: string;
  prompt: string;
  icon?: string;
  category?: string;
}

export const BUILTIN_TEMPLATES: PromptTemplate[] = [
  {
    id: "remove-bg",
    label: "Remove Background",
    prompt: "Remove the background from this image, making it transparent",
    category: "editing",
  },
  {
    id: "cinematic",
    label: "Make Cinematic",
    prompt: "Apply a cinematic film look to this image with dramatic lighting and color grading",
    category: "style",
  },
  {
    id: "upscale",
    label: "Upscale 2x",
    prompt: "Upscale this image to 2x resolution while preserving all details",
    category: "enhance",
  },
  {
    id: "cartoon",
    label: "Cartoon Style",
    prompt: "Convert this image to a cartoon or anime art style",
    category: "style",
  },
  {
    id: "neon-glow",
    label: "Neon Glow",
    prompt: "Add a neon glow effect to the main subject in this image",
    category: "effect",
  },
  {
    id: "sketch",
    label: "Pencil Sketch",
    prompt: "Convert this image into a pencil sketch drawing",
    category: "style",
  },
  {
    id: "oil-painting",
    label: "Oil Painting",
    prompt: "Transform this image into an oil painting masterpiece",
    category: "style",
  },
  {
    id: "replace-bg-white",
    label: "White Background",
    prompt: "Replace the background with a clean solid white background",
    category: "editing",
  },
  {
    id: "enhance-lighting",
    label: "Enhance Lighting",
    prompt: "Enhance the lighting and contrast of this image",
    category: "enhance",
  },
  {
    id: "vintage",
    label: "Vintage Look",
    prompt: "Apply a vintage retro film look to this image",
    category: "style",
  },
];
