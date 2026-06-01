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
import { editImageTransfer } from "../components/editor/ResultActions";


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

// --- Crop helpers ---
interface CropRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

const HANDLE_RADIUS = 10;
const MIN_CROP = 30;

function getHandleAt(mx: number, my: number, r: CropRect): string | null {
  const cx = (x: number) => Math.abs(mx - x) <= HANDLE_RADIUS;
  const cy = (y: number) => Math.abs(my - y) <= HANDLE_RADIUS;
  const { left, top, width, height } = r;
  const rt = left + width;
  const bt = top + height;
  const mc = left + width / 2;
  const mr = top + height / 2;

  if (cx(left) && cy(top)) return "nw";
  if (cx(rt) && cy(top)) return "ne";
  if (cx(left) && cy(bt)) return "sw";
  if (cx(rt) && cy(bt)) return "se";
  if (cx(mc) && cy(top)) return "n";
  if (cx(mc) && cy(bt)) return "s";
  if (cx(rt) && cy(mr)) return "e";
  if (cx(left) && cy(mr)) return "w";

  // Inside rect = move
  if (mx >= left && mx <= rt && my >= top && my <= bt) return "move";
  return null;
}

function cursorForHandle(handle: string | null): string {
  switch (handle) {
    case "nw": return "nw-resize";
    case "ne": return "ne-resize";
    case "sw": return "sw-resize";
    case "se": return "se-resize";
    case "n": return "n-resize";
    case "s": return "s-resize";
    case "e": return "e-resize";
    case "w": return "w-resize";
    case "move": return "move";
    default: return "default";
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}

async function canvasEdit(
  src: string,
  draw: (ctx: CanvasRenderingContext2D, img: HTMLImageElement, canvas: HTMLCanvasElement) => void,
): Promise<string> {
  const img = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d")!;
  draw(ctx, img, canvas);
  return canvas.toDataURL("image/jpeg", 0.92);
}

async function rotateWithCanvas(src: string, deg: number): Promise<string> {
  const img = await loadImage(src);
  const rad = (deg * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  const w = Math.round(img.naturalWidth * cos + img.naturalHeight * sin);
  const h = Math.round(img.naturalWidth * sin + img.naturalHeight * cos);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.translate(w / 2, h / 2);
  ctx.rotate(rad);
  ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
  return canvas.toDataURL("image/jpeg", 0.92);
}

async function flipWithCanvas(src: string, horizontal: boolean): Promise<string> {
  return canvasEdit(src, (ctx, img) => {
    ctx.translate(horizontal ? img.naturalWidth : 0, horizontal ? 0 : img.naturalHeight);
    ctx.scale(horizontal ? -1 : 1, horizontal ? 1 : -1);
    ctx.drawImage(img, 0, 0);
  });
}

function clampRect(r: CropRect, maxW: number, maxH: number): CropRect {
  let { left, top, width, height } = r;
  width = Math.max(MIN_CROP, Math.min(width, maxW));
  height = Math.max(MIN_CROP, Math.min(height, maxH));
  if (left < 0) left = 0;
  if (top < 0) top = 0;
  if (left + width > maxW) left = maxW - width;
  if (top + height > maxH) top = maxH - height;
  return { left, top, width, height };
}

export default function Edit() {
  const showToast = useUIStore((s) => s.showToast);
  const apiKey = useSettingsStore((s) => s.apiKey);

  const {
    images: galleryImages,
    selectedImageId,
    isLoading: galleryLoading,
    selectImage,
    setImages,
    addImage,
    setIsLoading: setGalleryLoading,
  } = useGalleryStore();

  const selectedImage = galleryImages.find((img) => img.id === selectedImageId);
  const [sortBy, setSortBy] = useState("mtime-desc");
  const [showSort, setShowSort] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showSort) return;
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setShowSort(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showSort]);

  const SORT_OPTIONS = [
    { value: "mtime-desc", label: "Date modified (newest)" },
    { value: "mtime-asc", label: "Date modified (oldest)" },
    { value: "name-asc", label: "Name (A-Z)" },
  ];
  const currentSortLabel = SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? "Sort";

  const sortedImages = [...galleryImages].sort((a, b) => {
    switch (sortBy) {
      case "mtime-asc": return a.createdAt - b.createdAt;
      case "name-asc": return a.name.localeCompare(b.name);
      default: return b.createdAt - a.createdAt; // mtime-desc
    }
  });

  // Full-res data URL for the selected image
  const [fullResUrl, setFullResUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Handle incoming image from navigation state (e.g. from Generate page)
  useEffect(() => {
    if (editImageTransfer.value) {
      setFullResUrl(editImageTransfer.value);
      editImageTransfer.value = null;
    }
  }, []);

  // Attached reference images for AI Edit
  const [attachedImages, setAttachedImages] = useState<{ dataUrl: string; name: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter state (live preview via CSS, applied on commit)
  const [selectedFilter, setSelectedFilter] = useState("original");
  const [filterCss, setFilterCss] = useState("");

  // AI edit state
  const [aiLoading, setAiLoading] = useState(false);
  const [editAspect, setEditAspect] = useState("");
  const [editSize, setEditSize] = useState("");

  // --- Crop state (Canva-style) ---
  const [cropMode, setCropMode] = useState(false);
  const [cropRect, setCropRect] = useState<CropRect | null>(null);
  const [cropAspect, setCropAspect] = useState("free");
  // Drag state
  const [cropDrag, setCropDrag] = useState<{
    handle: string;
    startX: number;
    startY: number;
    origRect: CropRect;
  } | null>(null);
  const [cropCursor, setCropCursor] = useState("default");
  const previewRef = useRef<HTMLDivElement>(null);

  // ---- Cursor update on mouse move over handles ----
  const handleCropHover = useCallback((e: React.MouseEvent) => {
    if (!cropRect || cropDrag) return;
    const rect = previewRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    setCropCursor(cursorForHandle(getHandleAt(mx, my, cropRect)));
  }, [cropRect, cropDrag]);

  // ---- Mouse down: detect handle or start move ----
  const handleCropMouseDown = useCallback((e: React.MouseEvent) => {
    if (!cropRect) return;
    const rect = previewRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const handle = getHandleAt(mx, my, cropRect);
    if (!handle) return;
    e.preventDefault();
    setCropDrag({ handle, startX: mx, startY: my, origRect: { ...cropRect } });
  }, [cropRect]);

  // ---- Mouse move during drag ----
  const handleCropMouseMove = useCallback((e: React.MouseEvent) => {
    const drag = cropDrag;
    if (!drag || !cropRect) return;
    const rect = previewRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const dx = mx - drag.startX;
    const dy = my - drag.startY;

    const over = previewRef.current!;
    const pw = over.clientWidth;
    const ph = over.clientHeight;

    if (drag.handle === "move") {
      // Move the rect
      const next = clampRect({
        left: drag.origRect.left + dx,
        top: drag.origRect.top + dy,
        width: drag.origRect.width,
        height: drag.origRect.height,
      }, pw, ph);
      setCropRect(next);
      return;
    }

    // Resize
    let { left, top, width, height } = drag.origRect;

    // Apply free resize first, then constrain if aspect locked
    switch (drag.handle) {
      case "se": width += dx; height += dy; break;
      case "sw": left += dx; width -= dx; height += dy; break;
      case "ne": width += dx; top += dy; height -= dy; break;
      case "nw": left += dx; width -= dx; top += dy; height -= dy; break;
      case "n": top += dy; height -= dy; break;
      case "s": height += dy; break;
      case "e": width += dx; break;
      case "w": left += dx; width -= dx; break;
    }

    // Enforce minimum
    if (width < MIN_CROP) width = MIN_CROP;
    if (height < MIN_CROP) height = MIN_CROP;

    // Aspect ratio constraint (corner handles only)
    if (cropAspect !== "free" && !["n", "s", "e", "w"].includes(drag.handle)) {
      const [aw, ah] = cropAspect.split(":").map(Number);
      const ratio = aw / ah;

      // Determine anchor corner (opposite of handle)
      const anchorX = drag.handle.includes("w") ? drag.origRect.left + drag.origRect.width : drag.origRect.left;
      const anchorY = drag.handle.includes("n") ? drag.origRect.top + drag.origRect.height : drag.origRect.top;

      // Get signed distance from anchor to mouse
      const distX = drag.handle.includes("w") ? anchorX - mx : mx - anchorX;
      const distY = drag.handle.includes("n") ? anchorY - my : my - anchorY;

      let newW: number, newH: number;
      // Use the larger distance as driver
      if (Math.abs(distX) > Math.abs(distY)) {
        newW = Math.max(MIN_CROP, Math.abs(distX));
        newH = newW / ratio;
      } else {
        newH = Math.max(MIN_CROP, Math.abs(distY));
        newW = newH * ratio;
      }

      // Recalculate position
      if (drag.handle.includes("e")) left = drag.origRect.left;
      else left = anchorX - newW;

      if (drag.handle.includes("s")) top = drag.origRect.top;
      else top = anchorY - newH;

      width = newW;
      height = newH;
    }

    setCropRect(clampRect({ left, top, width, height }, pw, ph));
  }, [cropDrag, cropRect, cropAspect]);

  const handleCropMouseUp = useCallback(() => {
    setCropDrag(null);
  }, []);

  // ---- Init / deactivate crop ----
  const handleToggleCrop = useCallback(() => {
    if (!cropMode) {
      const imgEl = document.getElementById("preview-img") as HTMLImageElement | null;
      if (!imgEl) return;
      const container = imgEl.parentElement;
      if (!container) return;
      const imgRect = imgEl.getBoundingClientRect();
      const contRect = container.getBoundingClientRect();
      const left = Math.max(0, imgRect.left - contRect.left);
      const top = Math.max(0, imgRect.top - contRect.top);
      const width = Math.min(container.clientWidth - left, imgRect.width);
      const height = Math.min(container.clientHeight - top, imgRect.height);
      setCropRect({ left, top, width, height });
      setCropMode(true);
      setCropDrag(null);
    } else {
      setCropMode(false);
      setCropRect(null);
      setCropDrag(null);
    }
  }, [cropMode]);

  const handleCancelCrop = useCallback(() => {
    setCropMode(false);
    setCropRect(null);
    setCropDrag(null);
  }, []);

  // ---- Apply crop ----
  const handleApplyCrop = useCallback(async () => {
    if (!cropRect || !(selectedImage || fullResUrl)) return;
    const imgEl = document.getElementById("preview-img") as HTMLImageElement | null;
    const overlay = previewRef.current;
    if (!imgEl || !overlay) return;

    const imgRect = imgEl.getBoundingClientRect();
    const ovRect = overlay.getBoundingClientRect();
    const scaleX = imgEl.naturalWidth / imgRect.width;
    const scaleY = imgEl.naturalHeight / imgRect.height;

    // cropRect is relative to overlay — subtract image offset
    const relLeft = cropRect.left - (imgRect.left - ovRect.left);
    const relTop = cropRect.top - (imgRect.top - ovRect.top);

    const sx = Math.round(Math.max(0, relLeft * scaleX));
    const sy = Math.round(Math.max(0, relTop * scaleY));
    const sw = Math.round(Math.min(cropRect.width * scaleX, imgEl.naturalWidth - sx));
    const sh = Math.round(Math.min(cropRect.height * scaleY, imgEl.naturalHeight - sy));

    if (sw < 5 || sh < 5) {
      showToast("Selection too small", "error");
      return;
    }

    const src = fullResUrl ?? selectedImage?.dataUrl ?? "";
    if (!src) return;
    const img = await loadImage(src);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(sw);
    canvas.height = Math.round(sh);
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, Math.round(sx), Math.round(sy), Math.round(sw), Math.round(sh), 0, 0, Math.round(sw), Math.round(sh));
    const result = canvas.toDataURL("image/jpeg", 0.92);

    setFullResUrl(result);
    setCropMode(false);
    setCropRect(null);
    setCropDrag(null);
    showToast("Image cropped", "success");
  }, [cropRect, selectedImage, fullResUrl, showToast]);

  // ---- Set aspect ratio & auto-adjust crop rect ----
  const handleSetCropAspect = useCallback((aspect: string) => {
    setCropAspect(aspect);
    if (!cropRect || aspect === "free") return;

    const [aw, ah] = aspect.split(":").map(Number);
    const ratio = aw / ah;
    const { left, top, width, height } = cropRect;

    // Fit ratio within container bounds, centered on current selection
    const overlay = previewRef.current;
    const container = document.getElementById("preview-img")?.parentElement;
    const maxW = overlay?.clientWidth ?? container?.clientWidth ?? width;
    const maxH = overlay?.clientHeight ?? container?.clientHeight ?? height;

    let newW: number, newH: number;
    if (maxW / maxH > ratio) {
      newH = maxH;
      newW = maxH * ratio;
    } else {
      newW = maxW;
      newH = maxW / ratio;
    }

    const centerX = left + width / 2;
    const centerY = top + height / 2;

    setCropRect(clampRect({
      left: centerX - newW / 2,
      top: centerY - newH / 2,
      width: newW,
      height: newH,
    }, maxW, maxH));
  }, [cropRect]);

  // Load full-res when image selected
  useEffect(() => {
    if (!selectedImage) { return; }
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

  // Exit crop when image changes
  useEffect(() => {
    if (cropMode) {
      setCropMode(false);
      setCropRect(null);
      setCropDrag(null);
    }
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
      const files = await readGalleryFolder(folder as string);

      for (const file of files) {
        const name = file.path.split("/").pop() ?? "image";
        const dataUrl = await readFileAsDataUrl(file.path);

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
          path: file.path,
          dataUrl: thumb,
          width: img.naturalWidth,
          height: img.naturalHeight,
          createdAt: file.mtime,
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`Failed to load folder: ${msg}`, "error");
    } finally {
      setGalleryLoading(false);
    }
  }, [addImage, setImages, selectImage, setGalleryLoading, showToast]);

  const handleFilterSelect = useCallback((key: string, css: string) => {
    setSelectedFilter(key);
    setFilterCss(css);
  }, []);

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

  const handleAiEdit = useCallback(async (prompt: string) => {
    if (!apiKey || !(selectedImage || fullResUrl)) return;
    setAiLoading(true);
    try {
      const source = fullResUrl ?? selectedImage?.dataUrl ?? "";
      const extraImages = attachedImages.map((img) => img.dataUrl);
      const model = useSettingsStore.getState().editModel;
      const imgConfig: import("../services/openrouter").ImageConfig = {};
      if (editAspect) imgConfig.aspect_ratio = editAspect;
      if (editSize) imgConfig.image_size = editSize;
      const result = await editImage(apiKey, model, source, prompt, extraImages, imgConfig);

      // Convert to persistent data URL so it can be used as source again
      const img = await loadImage(result);
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      const permanentUrl = canvas.toDataURL("image/jpeg", 0.92);

      setFullResUrl(permanentUrl);
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

  const handleSave = useCallback(async () => {
    const canvas = canvasRef.current;
    const imgEl = document.querySelector("#preview-img") as HTMLImageElement | null;
    if (!canvas || !imgEl) return;

    const w = imgEl.naturalWidth;
    const h = imgEl.naturalHeight;
    if (!w || !h) return;

    const src = fullResUrl ?? selectedImage?.dataUrl;
    if (!src) return;

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

  // --- Canvas operations ---
  const currentSrc = fullResUrl ?? selectedImage?.dataUrl ?? null;

  const handleRotate = useCallback(async (deg: number) => {
    if (!currentSrc) return;
    try {
      const result = await rotateWithCanvas(currentSrc, deg);
      setFullResUrl(result);
      showToast(`Rotated ${deg}°`, "success");
    } catch { showToast("Rotation failed", "error"); }
  }, [currentSrc, showToast]);

  const handleFlip = useCallback(async (horizontal: boolean) => {
    if (!currentSrc) return;
    try {
      const result = await flipWithCanvas(currentSrc, horizontal);
      setFullResUrl(result);
      showToast(horizontal ? "Flipped horizontally" : "Flipped vertically", "success");
    } catch { showToast("Flip failed", "error"); }
  }, [currentSrc, showToast]);

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
              <div className="relative max-h-full max-w-full overflow-hidden rounded-xl bg-surface shadow-md">
                <img
                  id="preview-img"
                  src={fullResUrl ?? selectedImage!.dataUrl}
                  alt={selectedImage?.name ?? "Preview"}
                  className="max-h-[calc(100vh-220px)] max-w-full object-contain"
                  style={{ filter: filterCss || undefined }}
                />
                {cropMode && cropRect && (
                  <div
                    ref={previewRef}
                    className="absolute inset-0 z-10"
                    style={{ cursor: cropCursor }}
                    onMouseEnter={handleCropHover}
                    onMouseMove={(e) => {
                      handleCropHover(e);
                      handleCropMouseMove(e);
                    }}
                    onMouseDown={handleCropMouseDown}
                    onMouseUp={handleCropMouseUp}
                    onMouseLeave={handleCropMouseUp}
                  >
                    {/* Dark overlay outside rect */}
                    <div
                      className="absolute pointer-events-none"
                      style={{
                        left: cropRect.left,
                        top: cropRect.top,
                        width: cropRect.width,
                        height: cropRect.height,
                        boxShadow: "0 0 0 9999px rgba(0,0,0,0.45)",
                        zIndex: 1,
                      }}
                    />

                    {/* Rule-of-thirds grid */}
                    <div
                      className="absolute pointer-events-none"
                      style={{
                        left: cropRect.left,
                        top: cropRect.top,
                        width: cropRect.width,
                        height: cropRect.height,
                        zIndex: 2,
                      }}
                    >
                      {/* Vertical lines */}
                      <div className="absolute top-0 bottom-0 w-px bg-surface/30" style={{ left: "33.33%" }} />
                      <div className="absolute top-0 bottom-0 w-px bg-surface/30" style={{ left: "66.66%" }} />
                      {/* Horizontal lines */}
                      <div className="absolute left-0 right-0 h-px bg-surface/30" style={{ top: "33.33%" }} />
                      <div className="absolute left-0 right-0 h-px bg-surface/30" style={{ top: "66.66%" }} />
                    </div>

                    {/* Drag handles (corners + edges) */}
                    {(["nw", "ne", "sw", "se", "n", "s", "e", "w"] as const).map((h) => {
                      let cx: number, cy: number;
                      const r = cropRect!;
                      switch (h) {
                        case "nw": cx = r.left; cy = r.top; break;
                        case "ne": cx = r.left + r.width; cy = r.top; break;
                        case "sw": cx = r.left; cy = r.top + r.height; break;
                        case "se": cx = r.left + r.width; cy = r.top + r.height; break;
                        case "n": cx = r.left + r.width / 2; cy = r.top; break;
                        case "s": cx = r.left + r.width / 2; cy = r.top + r.height; break;
                        case "e": cx = r.left + r.width; cy = r.top + r.height / 2; break;
                        case "w": cx = r.left; cy = r.top + r.height / 2; break;
                      }
                      const isCorner = ["nw", "ne", "sw", "se"].includes(h);
                      return (
                        <div
                          key={h}
                          className="absolute pointer-events-none"
                          style={{
                            left: cx - 6,
                            top: cy - 6,
                            width: isCorner ? 14 : 10,
                            height: isCorner ? 14 : 10,
                            borderRadius: isCorner ? 2 : "50%",
                            backgroundColor: "white",
                            border: "2px solid #555",
                            zIndex: 3,
                            transform: isCorner ? "rotate(45deg)" : undefined,
                          }}
                        />
                      );
                    })}
                  </div>
                )}
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
            <div className="flex items-center justify-between px-4 py-1.5 border-b border-border">
              <span className="text-[11px] text-text-tertiary">{galleryImages.length} images</span>
              <div className="relative" ref={sortRef}>
                <button
                  onClick={() => setShowSort(!showSort)}
                  className="flex items-center gap-1 text-[11px] text-text-secondary hover:text-text-primary transition-colors rounded-md border border-border bg-surface px-2 py-1"
                >
                  {currentSortLabel}
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${showSort ? "rotate-180" : ""}`}>
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {showSort && (
                  <div className="absolute right-0 top-full mt-1 z-50 w-52 rounded-lg border border-border bg-surface shadow-lg overflow-hidden">
                    {SORT_OPTIONS.map((o) => (
                      <button
                        key={o.value}
                        onClick={() => { setSortBy(o.value); setShowSort(false); }}
                        className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                          sortBy === o.value
                            ? "bg-accent/10 text-accent font-medium"
                            : "text-text-secondary hover:bg-bg-secondary"
                        }`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <ImageStrip
              images={sortedImages}
              selectedId={selectedImageId}
              onSelect={selectImage}
            />
          </div>
        </div>

        {/* Right: tools panel */}
        <div className="w-72 shrink-0">
          <ToolsPanel
            hasImage={!!(selectedImage || fullResUrl)}
            attachedImages={attachedImages}
            onAttachImages={() => fileInputRef.current?.click()}
            onRemoveAttachedImage={removeAttachedImage}
            onFilterSelect={handleFilterSelect}
            selectedFilter={selectedFilter}
            onAiEdit={handleAiEdit}
            aiLoading={aiLoading}
            cropMode={cropMode}
            cropAspect={cropAspect}
            onToggleCrop={handleToggleCrop}
            onApplyCrop={handleApplyCrop}
            onCancelCrop={handleCancelCrop}
            onSetCropAspect={handleSetCropAspect}
            onRotate={handleRotate}
            onFlip={handleFlip}
            editAspect={editAspect}
            editSize={editSize}
            onSetEditAspect={setEditAspect}
            onSetEditSize={setEditSize}
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
