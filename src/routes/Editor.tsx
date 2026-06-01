import { useState, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Download } from "lucide-react";
import FilterControls from "../components/editor/FilterControls";
import Button from "../components/common/Button";
import { useUIStore } from "../stores/uiStore";
import { saveImage } from "../services/tauriCommands";
import { applyFilter } from "../services/imageFilters";

export default function Editor() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const imageDataUrl = (state as any)?.imageDataUrl as string | undefined;
  const showToast = useUIStore((s) => s.showToast);

  const [selectedFilter, setSelectedFilter] = useState("original");
  const [filterCss, setFilterCss] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleFilterSelect = useCallback((key: string, css: string) => {
    setSelectedFilter(key);
    setFilterCss(css);
  }, []);

  const handleSave = useCallback(async () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const w = img.naturalWidth;
    const h = img.naturalHeight;
    if (!w || !h) return;

    // Draw original to canvas, then apply filter pixel by pixel
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0);

    if (filterCss) {
      const imageData = ctx.getImageData(0, 0, w, h);
      const filtered = applyFilter(imageData, filterCss);
      ctx.putImageData(filtered, 0, 0);
    }

    const result = canvas.toDataURL("image/jpeg", 0.92);
    const name = `edited-${Date.now()}.jpg`;

    await saveImage(result, name);
    showToast("Image saved!", "success");
    navigate(-1);
  }, [filterCss, navigate, showToast]);

  if (!imageDataUrl) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-text-secondary">No image provided.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-border px-6 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-bg-secondary hover:text-text-primary transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-base font-medium text-text-primary">Edit Image</h1>
        </div>
        <Button onClick={handleSave}>
          <Download size={14} />
          Apply
        </Button>
      </header>

      {/* Preview */}
      <div className="flex flex-1 items-center justify-center overflow-hidden bg-black/5 p-6">
        <div className="max-h-full max-w-full overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
          <img
            ref={imgRef}
            src={imageDataUrl}
            alt="Editing"
            className="max-h-[65vh] max-w-full object-contain"
            style={{ filter: filterCss }}
          />
        </div>
      </div>

      {/* Filter bar */}
      <div className="border-t border-border px-6 py-4">
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-text-tertiary">
          Filters
        </p>
        <FilterControls selected={selectedFilter} onSelect={handleFilterSelect} />
      </div>

      {/* Hidden canvas for export */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
