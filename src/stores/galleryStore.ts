import { create } from "zustand";
import type { GalleryImage } from "../types/image";
import type { PromptTemplate } from "../types/template";

interface GalleryState {
  images: GalleryImage[];
  selectedImageId: string | null;
  templates: PromptTemplate[];
  isLoading: boolean;

  // Actions
  setImages: (images: GalleryImage[]) => void;
  selectImage: (id: string | null) => void;
  setTemplates: (templates: PromptTemplate[]) => void;
  setIsLoading: (loading: boolean) => void;
  addImage: (image: GalleryImage) => void;
  removeImage: (id: string) => void;
}

export const useGalleryStore = create<GalleryState>((set) => ({
  images: [],
  selectedImageId: null,
  templates: [],
  isLoading: false,

  setImages: (images) => set({ images }),
  selectImage: (id) => set({ selectedImageId: id }),
  setTemplates: (templates) => set({ templates }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  addImage: (image) =>
    set((state) => ({ images: [image, ...state.images] })),
  removeImage: (id) =>
    set((state) => ({
      images: state.images.filter((img) => img.id !== id),
      selectedImageId:
        state.selectedImageId === id ? null : state.selectedImageId,
    })),
}));
