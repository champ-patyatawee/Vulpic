import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FolderOpen } from "lucide-react";
import ImageGrid from "../components/gallery/ImageGrid";
import ImageDetail from "../components/gallery/ImageDetail";
import { useGalleryStore } from "../stores/galleryStore";
import { useSettingsStore } from "../stores/settingsStore";
import { useChatStore } from "../stores/chatStore";
import { BUILTIN_TEMPLATES } from "../types/template";
import type { PromptTemplate } from "../types/template";
import { readGalleryFolder } from "../services/tauriCommands";
import Button from "../components/common/Button";
import { useUIStore } from "../stores/uiStore";

export default function GalleryMode() {
  const navigate = useNavigate();
  const {
    images,
    selectedImageId,
    templates,
    isLoading,
    setTemplates,
    selectImage,
    addImage,
    setIsLoading,
  } = useGalleryStore();

  const galleryFolder = useSettingsStore((s) => s.galleryFolder);
  const createConversation = useChatStore((s) => s.createConversation);
  const showToast = useUIStore((s) => s.showToast);

  const selectedImage = images.find((img) => img.id === selectedImageId);

  // Load built-in templates
  useEffect(() => {
    if (templates.length === 0) {
      setTemplates(BUILTIN_TEMPLATES);
    }
  }, [templates.length, setTemplates]);

  // Auto-load gallery folder
  useEffect(() => {
    if (galleryFolder && images.length === 0) {
      loadFolder(galleryFolder);
    }
  }, [galleryFolder]);

  const loadFolder = useCallback(
    async (folderPath: string) => {
      setIsLoading(true);
      try {
        const paths = await readGalleryFolder(folderPath);
        // For each path, read and create gallery images
        for (const filePath of paths) {
          const { convertFileSrc } = await import("@tauri-apps/api/core");
          
          // Use convertFileSrc for Tauri asset protocol
          const assetUrl = convertFileSrc(filePath);
          const name = filePath.split("/").pop() ?? "image";

          // Create a thumbnail via canvas
          const img = new Image();
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = reject;
            img.src = assetUrl;
          });

          const canvas = document.createElement("canvas");
          canvas.width = 200;
          canvas.height = 200;
          const ctx = canvas.getContext("2d")!;
          ctx.drawImage(img, 0, 0, 200, 200);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.7);

          addImage({
            id: crypto.randomUUID(),
            name,
            path: filePath,
            dataUrl,
            width: img.naturalWidth,
            height: img.naturalHeight,
            createdAt: Date.now(),
          });
        }
      } catch (err) {
        console.error("Failed to load gallery folder:", err);
        showToast("Failed to load gallery folder", "error");
      } finally {
        setIsLoading(false);
      }
    },
    [addImage, setIsLoading, showToast]
  );

  const handleApplyTemplate = useCallback(
    (template: PromptTemplate) => {
      if (!selectedImage) return;

      // Create a new chat conversation with the image + template as context
      const convId = createConversation();
      navigate(`/chat/${convId}`, {
        state: {
          initialPrompt: template.prompt,
          initialImage: selectedImage,
        },
      });
    },
    [selectedImage, createConversation, navigate]
  );

  return (
    <div className="flex h-full flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-border px-6 py-3">
        <h1 className="text-lg font-medium text-text-primary">Gallery</h1>
        <Button
          variant="secondary"
          size="sm"
          onClick={async () => {
            const { open } = await import("@tauri-apps/plugin-dialog");
            const folder = await open({ directory: true });
            if (folder) {
              loadFolder(folder as string);
            }
          }}
        >
          <FolderOpen size={16} />
          Open Folder
        </Button>
      </header>

      {/* Content */}
      <div className="flex flex-1 gap-6 overflow-hidden p-6">
        {/* Image grid */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                <span className="text-sm text-text-secondary">Loading images...</span>
              </div>
            </div>
          ) : (
            <ImageGrid
              images={images}
              selectedId={selectedImageId}
              onSelect={selectImage}
            />
          )}
        </div>

        {/* Image detail sidebar */}
        {selectedImage && (
          <div className="w-80 shrink-0 overflow-y-auto border-l border-border pl-6">
            <ImageDetail
              image={selectedImage}
              templates={templates}
              onApplyTemplate={handleApplyTemplate}
            />
          </div>
        )}
      </div>
    </div>
  );
}
