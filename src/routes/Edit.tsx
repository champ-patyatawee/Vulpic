import { useState, useEffect, useCallback, useRef } from "react";
import { FolderOpen, Image as ImageIcon } from "lucide-react";
import ImageStrip from "../components/edit/ImageStrip";
import ToolsPanel from "../components/edit/ToolsPanel";
import Button from "../components/common/Button";
import { useGalleryStore } from "../stores/galleryStore";
import { useSettingsStore } from "../stores/settingsStore";
import { useUIStore } from "../stores/uiStore";
import { readGalleryFolder } from "../services/tauriCommands";
import { editImage } from "../services/openrouter";
import { applyFilter } from "../services/imageFilters";
import { saveImage } from "../services/tauriCommands";
import { BUILTIN_TEMPLATES } from "../types/template";
import type { PromptTemplate } from "../types/template";

const EXT_TO_MIME: Record<string, string> = {
  png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg",
  gif: "image/gif", webp: "image/webp", bmp: "image/bmp",
};

function mimeFromPath(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  return EXT_TO_MIME[ext] ?? "image/png";
}

async function readFileAsDataUrl(filePath: string): Promise<string> {
  const { readFile } = await import("@tauri-apps/plugin-fs");
  const bytes = await readFile(filePath);
  const mime = mimeFromPath(filePath);
  const blob = new Blob([bytes], { type: mime });
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}

export default function Edit() {
  const showToast = useUIStore((s) => s.showToast);
  const apiKey = useSettingsStore((s) => s.apiKey);

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

  const selectedImage = galleryImages.find((img) => img.id === selectedImageId);

  // Full-res data URL for the selected image
  const [fullResUrl, setFullResUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Attached reference images for AI Edit
  const [attachedImages, setAttachedImages] = useState<{ dataUrl: string; name: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter state (live preview via CSS, applied on commit)
  const [selectedFilter, setSelectedFilter] = useState("original");
  const [filterCss, setFilterCss] = useState("");

  // AI edit state
  const [aiLoading, setAiLoading] = useState(false);

  // Load built-in templates
  useEffect(() => {
    if (templates.length === 0) {
      setTemplates(BUILTIN_TEMPLATES);
    }
  }, [templates.length, setTemplates]);

  // Load full-res when image selected
  useEffect(() => {
    if (!selectedImage) { setFullResUrl(null); return; }
    let cancelled = false;
    setFullResUrl(null);
    (async () => {
      try {
        const url = await readFileAsDataUrl(selectedImage.path);
        if (!cancelled) setFullResUrl(url);
      } catch { /* fallback to thumbnail */ }
    })();
    return () => { cancelled = true; };
  }, [selectedImage?.id]);

  // Open folder
  const handleOpenFolder = useCallback(async () => {
    try {
      const { open } = await import("@tauri-apps/plugin-dialog");
      const folder = await open({ directory: true });
      if (!folder) return;

      setImages([]);
      selectImage(null);
      setGalleryLoading(true);
      const paths = await readGalleryFolder(folder as string);

      for (const filePath of paths) {
        const name = filePath.split("/").pop() ?? "image";
        const dataUrl = await readFileAsDataUrl(filePath);

        // Create thumbnail
        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error(`Failed to decode: ${name}`));
          img.src = dataUrl;
        });

        const MAX = 200;
        let w = img.naturalWidth, h = img.naturalHeight;
        if (w > h) { w = MAX; h = (MAX / img.naturalWidth) * img.naturalHeight; }
        else { h = MAX; w = (MAX / img.naturalHeight) * img.naturalWidth; }

        const canvas = document.createElement("canvas");
        canvas.width = Math.round(w);
        canvas.height = Math.round(h);
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const thumb = canvas.toDataURL("image/jpeg", 0.7);

        addImage({
          id: crypto.randomUUID(),
          name,
          path: filePath,
          dataUrl: thumb,
          width: img.naturalWidth,
          height: img.naturalHeight,
          createdAt: Date.now(),
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`Failed to load folder: ${msg}`, "error");
    } finally {
      setGalleryLoading(false);
    }
  }, [addImage, setImages, selectImage, setGalleryLoading, showToast]);

  // Filter select
  const handleFilterSelect = useCallback((key: string, css: string) => {
    setSelectedFilter(key);
    setFilterCss(css);
  }, []);

  // Attach reference images
  const handleAttachImages = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    for (const file of files) {
      const reader = new FileReader();
      reader.onload = () => {
        setAttachedImages((prev) => [...prev, { dataUrl: reader.result as string, name: file.name }]);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const removeAttachedImage = useCallback((index: number) => {
    setAttachedImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // AI Edit
  const handleAiEdit = useCallback(async (prompt: string) => {
    if (!apiKey || !selectedImage) return;
    setAiLoading(true);
    try {
      const source = fullResUrl ?? selectedImage.dataUrl;
      const extraImages = attachedImages.map((img) => img.dataUrl);
      const model = useSettingsStore.getState().editModel;
      const result = await editImage(apiKey, model, source, prompt, extraImages);
      // Show result by setting it as the current image
      setFullResUrl(result);
      setAttachedImages([]);
      setSelectedFilter("original");
      setFilterCss("");
      showToast("AI edit complete", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "AI edit failed", "error");
    } finally {
      setAiLoading(false);
    }
  }, [apiKey, selectedImage, fullResUrl, attachedImages, showToast]);

  // Save current canvas
  const handleSave = useCallback(async () => {
    const canvas = canvasRef.current;
    const imgEl = document.querySelector("#preview-img") as HTMLImageElement | null;
    if (!canvas || !imgEl) return;

    const w = imgEl.naturalWidth;
    const h = imgEl.naturalHeight;
    if (!w || !h) return;

    const src = fullResUrl ?? selectedImage?.dataUrl;
    if (!src) return;

    // Draw source to canvas then apply filter if any
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;

    const tempImg = new Image();
    await new Promise<void>((resolve, reject) => {
      tempImg.onload = () => resolve();
      tempImg.onerror = reject;
      tempImg.src = src;
    });
    ctx.drawImage(tempImg, 0, 0);

    if (filterCss) {
      const imageData = ctx.getImageData(0, 0, w, h);
      const filtered = applyFilter(imageData, filterCss);
      ctx.putImageData(filtered, 0, 0);
    }

    const result = canvas.toDataURL("image/jpeg", 0.92);
    await saveImage(result, `edited-${Date.now()}.jpg`);
    showToast("Image saved!", "success");
  }, [fullResUrl, selectedImage, filterCss, showToast]);

  // Copy to clipboard
  const handleCopy = useCallback(async () => {
    const src = fullResUrl ?? selectedImage?.dataUrl;
    if (!src) return;
    try {
      const res = await fetch(src);
      const blob = await res.blob();
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      showToast("Copied to clipboard!", "success");
    } catch {
      showToast("Failed to copy", "error");
    }
  }, [fullResUrl, selectedImage, showToast]);

  // Quick edit template
  const handleApplyTemplate = useCallback((template: PromptTemplate) => {
    if (!selectedImage) return;
    handleAiEdit(template.prompt);
  }, [selectedImage, handleAiEdit]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-border px-6 py-3">
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={handleOpenFolder}>
            <FolderOpen size={14} />
            Open Folder
          </Button>
          {galleryLoading && (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          )}
        </div>
        {selectedImage && (
          <div className="text-xs text-text-secondary">
            {selectedImage.name} &middot; {selectedImage.width}&times;{selectedImage.height}
          </div>
        )}
      </header>

      {/* Main area: canvas + tools */}
      <div className="flex flex-1 overflow-hidden">
        {/* Center: canvas preview */}
        <div className="flex flex-1 flex-col overflow-hidden bg-[#e8e8e8]">
          <div className="flex flex-1 items-center justify-center p-4">
            {fullResUrl || selectedImage ? (
              <div className="max-h-full max-w-full overflow-hidden rounded-xl bg-white shadow-md">
                <img
                  id="preview-img"
                  src={fullResUrl ?? selectedImage!.dataUrl}
                  alt={selectedImage?.name ?? "Preview"}
                  className="max-h-[calc(100vh-220px)] max-w-full object-contain"
                  style={{ filter: filterCss || undefined }}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 text-text-tertiary">
                <ImageIcon size={48} />
                <p className="text-sm">Open a folder or select an image</p>
              </div>
            )}
          </div>

          {/* Image strip at bottom */}
          <div className="border-t border-border bg-bg-primary">
            <ImageStrip
              images={galleryImages}
              selectedId={selectedImageId}
              onSelect={selectImage}
            />
          </div>
        </div>

        {/* Right: tools panel */}
        <div className="w-72 shrink-0">
          <ToolsPanel
            hasImage={!!selectedImage}
            attachedImages={attachedImages}
            onAttachImages={() => fileInputRef.current?.click()}
            onRemoveAttachedImage={removeAttachedImage}
            onFilterSelect={handleFilterSelect}
            selectedFilter={selectedFilter}
            onAiEdit={handleAiEdit}
            aiLoading={aiLoading}
            templates={templates}
            onApplyTemplate={handleApplyTemplate}
            onSave={handleSave}
            onCopy={handleCopy}
          />
        </div>
      </div>

      {/* Hidden canvas for export */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Hidden file input for attaching reference images */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleAttachImages}
      />
    </div>
  );
}
