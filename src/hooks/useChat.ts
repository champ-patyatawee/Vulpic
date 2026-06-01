import { useCallback } from "react";
import { useChatStore } from "../stores/chatStore";
import { useSettingsStore } from "../stores/settingsStore";
import { useUIStore } from "../stores/uiStore";
import { editImage, generateImage, queryImage } from "../services/openrouter";

export function useChat() {
  const {
    activeConversationId,
    currentModel,
    isGenerating,
    createConversation,
    addMessage,
    setIsGenerating,
  } = useChatStore();

  const apiKey = useSettingsStore((s) => s.apiKey);
  const showToast = useUIStore((s) => s.showToast);

  const send = useCallback(
    async (
      text: string,
      imageDataUrl?: string,
      imageName?: string
    ): Promise<string | null> => {
      if (!apiKey) {
        showToast("Please set your OpenRouter API key in Settings", "error");
        return null;
      }

      let convId = activeConversationId;
      if (!convId) {
        convId = createConversation();
      }

      const userMessage = {
        id: crypto.randomUUID(),
        role: "user" as const,
        content: [
          ...(imageDataUrl
            ? [{ type: "image" as const, dataUrl: imageDataUrl, name: imageName }]
            : []),
          ...(text ? [{ type: "text" as const, text }] : []),
        ],
        createdAt: Date.now(),
      };

      addMessage(convId!, userMessage);
      setIsGenerating(true);

      try {
        let result: string;

        if (imageDataUrl && text) {
          // Edit existing image with a prompt
          result = await editImage(apiKey, currentModel, imageDataUrl, text);
        } else if (imageDataUrl && !text) {
          // Q&A about an image
          result = await queryImage(apiKey, currentModel, imageDataUrl, "What's in this image?");
        } else {
          // Text-to-image generation (no input image)
          result = await generateImage(apiKey, currentModel, text);
        }

        addMessage(convId!, {
          id: crypto.randomUUID(),
          role: "assistant",
          content: [
            {
              type: "image",
              dataUrl: result,
              name: `vulpic-${Date.now()}`,
            },
          ],
          createdAt: Date.now(),
        });

        return convId;
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Something went wrong";
        addMessage(convId!, {
          id: crypto.randomUUID(),
          role: "assistant",
          content: [{ type: "text", text: `**Error:** ${errorMsg}` }],
          createdAt: Date.now(),
        });
        showToast(errorMsg, "error");
        return null;
      } finally {
        setIsGenerating(false);
      }
    },
    [apiKey, currentModel, activeConversationId, addMessage, createConversation, setIsGenerating, showToast]
  );

  return { send, isGenerating };
}
