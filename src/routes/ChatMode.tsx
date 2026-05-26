import { useEffect, useCallback, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FolderOpen, X } from "lucide-react";
import TopBar from "../components/layout/TopBar";
import ConversationThread from "../components/chat/ConversationThread";
import PromptBar from "../components/chat/PromptBar";
import ImageGrid from "../components/gallery/ImageGrid";
import ImageDetail from "../components/gallery/ImageDetail";
import { useChatStore } from "../stores/chatStore";
import { useSettingsStore } from "../stores/settingsStore";
import { useUIStore } from "../stores/uiStore";
import { useGalleryStore } from "../stores/galleryStore";
import { editImage, generateImage } from "../services/openrouter";
import { readGalleryFolder } from "../services/tauriCommands";
import { BUILTIN_TEMPLATES } from "../types/template";
import type { PromptTemplate } from "../types/template";
import Button from "../components/common/Button";

export default function ChatMode() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();

  const [galleryOpen, setGalleryOpen] = useState(false);
  const [editKey, setEditKey] = useState(0);
  const [pendingPrompt, setPendingPrompt] = useState<string | undefined>();
  const [pendingImage, setPendingImage] = useState<{ dataUrl: string; name: string } | undefined>();

  const {
    conversations,
    activeConversationId,
    currentModel,
    isGenerating,
    setActiveConversation,
    createConversation,
    addMessage,
    setIsGenerating,
  } = useChatStore();

  const apiKey = useSettingsStore((s) => s.apiKey);
  const showToast = useUIStore((s) => s.showToast);

  const {
    images: galleryImages,
    selectedImageId,
    templates,
    isLoading: galleryLoading,
    selectImage,
    setTemplates,
    setImages,
    addImage,
    setIsLoading: setGalleryLoading,
  } = useGalleryStore();

  const selectedGalleryImage = galleryImages.find(
    (img) => img.id === selectedImageId,
  );

  const [fullResUrl, setFullResUrl] = useState<string | null>(null);

  // When user selects an image, load the full-resolution version from disk
  useEffect(() => {
    if (!selectedGalleryImage) {
      setFullResUrl(null);
      return;
    }

    let cancelled = false;
    setFullResUrl(null);
    (async () => {
      try {
        const { readFile } = await import("@tauri-apps/plugin-fs");
        const bytes = await readFile(selectedGalleryImage.path);
        if (cancelled) return;
        const blob = new Blob([bytes]);
        const reader = new FileReader();
        reader.onload = () => {
          if (!cancelled) setFullResUrl(reader.result as string);
        };
        reader.readAsDataURL(blob);
      } catch {
        if (!cancelled) setFullResUrl(null);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedGalleryImage?.id]);

  // Load built-in templates on first mount
  useEffect(() => {
    if (templates.length === 0) {
      setTemplates(BUILTIN_TEMPLATES);
    }
  }, [templates.length, setTemplates]);

  // Sync URL param to active conversation
  useEffect(() => {
    if (conversationId) {
      setActiveConversation(conversationId);
    } else if (!activeConversationId) {
      const id = createConversation();
      navigate(`/chat/${id}`, { replace: true });
    }
  }, [conversationId]);

  const activeConversation = conversations.find(
    (c) => c.id === (conversationId ?? activeConversationId),
  );

  const handleOpenFolder = useCallback(async () => {
    try {
      const { open } = await import("@tauri-apps/plugin-dialog");
      const folder = await open({ directory: true });
      if (!folder) return;

      // Clear previous gallery content before loading new folder
      setImages([]);
      selectImage(null);
      setGalleryLoading(true);
      const paths = await readGalleryFolder(folder as string);

      for (const filePath of paths) {
        const name = filePath.split("/").pop() ?? "image";

        // Read file bytes directly via the fs plugin
        const { readFile } = await import("@tauri-apps/plugin-fs");
        const bytes = await readFile(filePath);

        // Convert to a base64 data URL for thumbnail
        const blob = new Blob([bytes]);
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });

        // Create thumbnail via canvas
        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error(`Failed to decode: ${name}`));
          img.src = dataUrl;
        });

        // Resize to fit within 200x200 while preserving aspect ratio
        const MAX = 200;
        let w = img.naturalWidth;
        let h = img.naturalHeight;
        if (w > h) { w = MAX; h = (MAX / img.naturalWidth) * img.naturalHeight; }
        else       { h = MAX; w = (MAX / img.naturalHeight) * img.naturalWidth; }
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(w);
        canvas.height = Math.round(h);
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const thumbnail = canvas.toDataURL("image/jpeg", 0.7);

        addImage({
          id: crypto.randomUUID(),
          name,
          path: filePath,
          dataUrl: thumbnail,
          width: img.naturalWidth,
          height: img.naturalHeight,
          createdAt: Date.now(),
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Failed to load gallery folder:", msg);
      showToast(`Failed to load gallery folder: ${msg}`, "error");
    } finally {
      setGalleryLoading(false);
    }
  }, [addImage, setImages, selectImage, setGalleryLoading, showToast]);

  const handleApplyTemplate = useCallback(
    (template: PromptTemplate) => {
      if (!selectedGalleryImage) return;

      const convId = createConversation();
      navigate(`/chat/${convId}`, {
        state: {
          initialPrompt: template.prompt,
          initialImage: selectedGalleryImage,
        },
      });
    },
    [selectedGalleryImage, createConversation, navigate],
  );

  const handleSend = useCallback(
    async (text: string, images?: { dataUrl: string; name: string }[]) => {
      if (!apiKey) {
        showToast("Please set your OpenRouter API key in Settings", "error");
        return;
      }

      // Ensure we have an active conversation
      let convId = activeConversationId;
      if (!convId) {
        convId = createConversation();
        navigate(`/chat/${convId}`, { replace: true });
      }

      // Build user message with multiple images
      const userMessage = {
        id: crypto.randomUUID(),
        role: "user" as const,
        content: [
          ...(images ?? []).map((img) => ({
            type: "image" as const,
            dataUrl: img.dataUrl,
            name: img.name,
          })),
          ...(text ? [{ type: "text" as const, text }] : []),
        ],
        createdAt: Date.now(),
      };

      addMessage(convId!, userMessage);
      setIsGenerating(true);

      try {
        let resultImage: string;

        if (images && images.length > 0 && text) {
          // Edit with image(s) – pass all images to the API
          const extraImages = images.slice(1).map((img) => img.dataUrl);
          resultImage = await editImage(
            apiKey,
            currentModel,
            images[0].dataUrl,
            text,
            extraImages,
          );
        } else if (text) {
          // Generate from text only
          resultImage = await generateImage(apiKey, currentModel, text);
        } else {
          return;
        }

        const assistantMessage = {
          id: crypto.randomUUID(),
          role: "assistant" as const,
          content: [
            {
              type: "image" as const,
              dataUrl: resultImage,
              name: `vulpic-${Date.now()}.png`,
            },
          ],
          createdAt: Date.now(),
        };

        addMessage(convId!, assistantMessage);
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
      } finally {
        setIsGenerating(false);
      }
    },
    [
      apiKey,
      currentModel,
      activeConversationId,
      addMessage,
      createConversation,
      navigate,
      setIsGenerating,
      showToast,
    ],
  );

  return (
    <>
      <TopBar
        onToggleGallery={() => setGalleryOpen((v) => !v)}
        galleryOpen={galleryOpen}
      />
      <div className="flex flex-1 overflow-hidden">
        {/* Chat area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <ConversationThread
            messages={activeConversation?.messages ?? []}
            isLoading={isGenerating}
          />
          <PromptBar
            key={conversationId}
            onSend={handleSend}
            disabled={isGenerating}
          />
        </div>

        {/* Gallery right sidebar */}
        {galleryOpen && (
          <aside className="w-80 shrink-0 border-l border-border bg-bg-primary overflow-y-auto">
            <div className="flex h-full flex-col">
              {/* Sidebar header */}
              <header className="flex items-center justify-between border-b border-border px-4 py-3">
                <h2 className="text-sm font-medium text-text-primary">
                  Gallery
                </h2>
                <div className="flex items-center gap-1">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleOpenFolder}
                  >
                    <FolderOpen size={14} />
                    Open Folder
                  </Button>
                  <button
                    onClick={() => setGalleryOpen(false)}
                    className="flex h-7 w-7 items-center justify-center rounded text-text-secondary hover:bg-bg-secondary hover:text-text-primary transition-colors"
                    title="Close gallery"
                  >
                    <X size={16} />
                  </button>
                </div>
              </header>

              {/* Gallery content */}
              <div className="flex-1 overflow-y-auto p-4">
                {galleryLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                      <span className="text-sm text-text-secondary">
                        Loading images...
                      </span>
                    </div>
                  </div>
                ) : selectedGalleryImage ? (
                  <div className="space-y-4">
                    <button
                      onClick={() => selectImage(null)}
                      className="text-xs text-accent hover:underline"
                    >
                      &larr; Back to grid
                    </button>
                    <ImageDetail
                      image={selectedGalleryImage}
                      fullDataUrl={fullResUrl ?? undefined}
                      templates={templates}
                      onApplyTemplate={handleApplyTemplate}
                    />
                  </div>
                ) : (
                  <ImageGrid
                    images={galleryImages}
                    selectedId={selectedImageId}
                    onSelect={selectImage}
                  />
                )}
              </div>
            </div>
          </aside>
        )}
      </div>
    </>
  );
}
