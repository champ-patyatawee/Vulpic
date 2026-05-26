import { create } from "zustand";

interface UIState {
  sidebarOpen: boolean;
  toastMessage: string | null;
  toastType: "success" | "error" | "info";

  // Actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  showToast: (message: string, type?: "success" | "error" | "info") => void;
  clearToast: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  toastMessage: null,
  toastType: "info",

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  showToast: (message, type = "info") =>
    set({ toastMessage: message, toastType: type }),
  clearToast: () => set({ toastMessage: null }),
}));
