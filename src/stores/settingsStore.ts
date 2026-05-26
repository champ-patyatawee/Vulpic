import { create } from "zustand";
import type { ModelId } from "../types/model";

interface SettingsState {
  apiKey: string;
  defaultModel: ModelId;
  theme: "light" | "dark";
  galleryFolder: string;

  // Actions
  setApiKey: (key: string) => void;
  setDefaultModel: (model: ModelId) => void;
  setTheme: (theme: "light" | "dark") => void;
  setGalleryFolder: (folder: string) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  apiKey: "",
  defaultModel: "openai/gpt-5.4-image-2",
  theme: "light",
  galleryFolder: "",

  setApiKey: (key) => set({ apiKey: key }),
  setDefaultModel: (model) => set({ defaultModel: model }),
  setTheme: (theme) => set({ theme }),
  setGalleryFolder: (folder) => set({ galleryFolder: folder }),
}));
