import { create } from "zustand";
import type { ModelId } from "../types/model";

interface SettingsState {
  apiKey: string;
  defaultModel: ModelId;
  editModel: ModelId;
  templateModel: ModelId;
  theme: "light" | "dark";
  galleryFolder: string;

  // Actions
  setApiKey: (key: string) => void;
  setDefaultModel: (model: ModelId) => void;
  setEditModel: (model: ModelId) => void;
  setTemplateModel: (model: ModelId) => void;
  setTheme: (theme: "light" | "dark") => void;
  setGalleryFolder: (folder: string) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  apiKey: "",
  defaultModel: "openai/gpt-5.4-image-2",
  editModel: "openai/gpt-5.4-image-2",
  templateModel: "openai/gpt-4o",
  theme: "light",
  galleryFolder: "",

  setApiKey: (key) => set({ apiKey: key }),
  setDefaultModel: (model) => set({ defaultModel: model }),
  setEditModel: (model) => set({ editModel: model }),
  setTemplateModel: (model) => set({ templateModel: model }),
  setTheme: (theme) => set({ theme }),
  setGalleryFolder: (folder) => set({ galleryFolder: folder }),
}));
