import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { idbStorage } from "./idbStorage";

export interface SavedTemplate {
  id: string;
  prompt: string;
  dataUrl: string;
  categoryName: string;
  itemName: string;
  createdAt: number;
}

interface SavedTemplatesState {
  saved: SavedTemplate[];
  addSaved: (tpl: SavedTemplate) => void;
  removeSaved: (id: string) => void;
}

export const useSavedTemplatesStore = create<SavedTemplatesState>()(
  persist(
    (set) => ({
      saved: [],
      addSaved: (tpl) => set((state) => ({ saved: [tpl, ...state.saved] })),
      removeSaved: (id) => set((state) => ({ saved: state.saved.filter((s) => s.id !== id) })),
    }),
    { name: "vulpic-saved-templates", storage: createJSONStorage(() => idbStorage) }
  )
);
