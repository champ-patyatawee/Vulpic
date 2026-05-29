import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Conversation, Message } from "../types/message";
import type { ModelId } from "../types/model";
import { idbStorage } from "./idbStorage";

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  currentModel: ModelId;
  isGenerating: boolean;

  // Actions
  setActiveConversation: (id: string) => void;
  createConversation: () => string;
  deleteConversation: (id: string) => void;
  addMessage: (conversationId: string, message: Message) => void;
  updateMessage: (conversationId: string, messageId: string, updatedMessage: Message) => void;
  setCurrentModel: (model: ModelId) => void;
  setIsGenerating: (generating: boolean) => void;
  clearActiveConversation: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      conversations: [],
      activeConversationId: null,
      currentModel: "openai/gpt-5.4-image-2",
      isGenerating: false,

      setActiveConversation: (id) => set({ activeConversationId: id }),

      createConversation: () => {
        const id = crypto.randomUUID();
        const conversation: Conversation = {
          id,
          title: "New Conversation",
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((state) => ({
          conversations: [conversation, ...state.conversations],
          activeConversationId: id,
        }));
        return id;
      },

      deleteConversation: (id) =>
        set((state) => ({
          conversations: state.conversations.filter((c) => c.id !== id),
          activeConversationId:
            state.activeConversationId === id
              ? state.conversations.find((c) => c.id !== id)?.id ?? null
              : state.activeConversationId,
        })),

      addMessage: (conversationId, message) =>
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  messages: [...c.messages, message],
                  updatedAt: Date.now(),
                  title:
                    c.messages.length === 0 && message.role === "user"
                      ? getMessagePreview(message)
                      : c.title,
                }
              : c
          ),
        })),

      updateMessage: (conversationId, messageId, updatedMessage) =>
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === messageId ? updatedMessage : m
                  ),
                  updatedAt: Date.now(),
                }
              : c
          ),
        })),

      setCurrentModel: (model) => set({ currentModel: model }),

      setIsGenerating: (generating) => set({ isGenerating: generating }),

      clearActiveConversation: () => set({ activeConversationId: null }),
    }),
    { name: "vulpic-chat", storage: createJSONStorage(() => idbStorage) }
  )
);

function getMessagePreview(message: Message): string {
  const textContent = message.content.find((c) => c.type === "text");
  if (textContent) {
    return textContent.text.slice(0, 60) + (textContent.text.length > 60 ? "..." : "");
  }
  const imageContent = message.content.find((c) => c.type === "image");
  return imageContent?.name ?? "Image conversation";
}
