import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  ChevronDown, ChevronRight, Send, Sparkles, Filter,
  ImagePlus, Crop, RotateCcw, FlipHorizontal, Settings2,
} from "lucide-react";
import FilterControls from "../editor/FilterControls";
import Button from "../common/Button";

interface ToolsPanelProps {
  hasImage: boolean;
  attachedImages: { dataUrl: string; name: string }[];
  onAttachImages: () => void;
  onRemoveAttachedImage: (index: number) => void;
  onFilterSelect: (key: string, css: string) => void;
  selectedFilter: string;
  onAiEdit: (prompt: string) => void;
  aiLoading: boolean;
  cropMode: boolean;
  cropAspect: string;
  onToggleCrop: () => void;
  onApplyCrop: () => void;
  onCancelCrop: () => void;
  onSetCropAspect: (aspect: string) => void;
  onRotate: (deg: number) => void;
  onFlip: (horizontal: boolean) => void;
  editAspect: string;
  editSize: string;
  onSetEditAspect: (v: string) => void;
  onSetEditSize: (v: string) => void;
  onSave: () => void;
  onCopy: () => void;
}

const ASPECTS = [
  { key: "free", label: "Free" },
  { key: "1:1", label: "□  1:1" },
  { key: "4:5", label: "▯  4:5" },
  { key: "2:3", label: "▯  2:3" },
  { key: "3:2", label: "▯  3:2" },
  { key: "4:3", label: "▯  4:3" },
  { key: "16:9", label: "▬ 16:9" },
  { key: "9:16", label: "▯  9:16" },
];

function CollapsibleSection({
  title,
  icon,
  defaultOpen,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-text-tertiary hover:text-text-primary transition-colors"
      >
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        {icon}
        {title}
      </button>
      {open && <div className="px-4 pb-3">{children}</div>}
    </div>
  );
}

export default function ToolsPanel({
  hasImage,
  attachedImages,
  onAttachImages,
  onRemoveAttachedImage,
  onFilterSelect,
  selectedFilter,
  onAiEdit,
  aiLoading,
  cropMode,
  cropAspect,
  onToggleCrop,
  onApplyCrop,
  onCancelCrop,
  onSetCropAspect,
  onRotate,
  onFlip,
  editAspect,
  editSize,
  onSetEditAspect,
  onSetEditSize,
  onSave,
  onCopy,
}: ToolsPanelProps) {
  const [aiPrompt, setAiPrompt] = useState("");
  const [showImgConfig, setShowImgConfig] = useState(false);
  const imgConfigRef = useRef<HTMLDivElement>(null);
  const imgConfigBtnRef = useRef<HTMLButtonElement>(null);
  const [configPos, setConfigPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!showImgConfig) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const isOutside = 
        !imgConfigRef.current?.contains(target) &&
        !imgConfigBtnRef.current?.contains(target);
      if (isOutside) {
        setShowImgConfig(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showImgConfig]);

  const openConfig = () => {
    if (imgConfigBtnRef.current) {
      const rect = imgConfigBtnRef.current.getBoundingClientRect();
      setConfigPos({ top: rect.top - 8, left: rect.left });
    }
    setShowImgConfig(true);
  };

  const ASPECT_OPTS = [
    { value: "", label: "Auto" },
    { value: "1:1", label: "1:1" },
    { value: "16:9", label: "16:9" },
    { value: "9:16", label: "9:16" },
    { value: "4:3", label: "4:3" },
    { value: "3:4", label: "3:4" },
    { value: "4:5", label: "4:5" },
  ];

  const SIZE_OPTS = [
    { value: "", label: "Auto" },
    { value: "1K", label: "1K" },
    { value: "2K", label: "2K" },
    { value: "4K", label: "4K" },
  ];

  const handleAiSend = () => {
    if (!aiPrompt.trim()) return;
    onAiEdit(aiPrompt.trim());
    setAiPrompt("");
  };

  return (
    <div className="flex h-full flex-col border-l border-border bg-bg-primary">
      {/* Always visible header */}
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-medium text-text-primary">Tools</h2>
      </div>

      {/* Scrollable sections */}
      <div className="flex-1 overflow-y-auto divide-y divide-border">
        {/* AI Edit */}
        <CollapsibleSection title="AI Edit" icon={<Sparkles size={14} />} defaultOpen>
          <div className="flex flex-col gap-2">
            {attachedImages.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {attachedImages.map((img, i) => (
                  <div key={i} className="relative h-10 w-10 shrink-0">
                    <img
                      src={img.dataUrl}
                      alt={img.name}
                      className="h-full w-full rounded object-cover"
                    />
                    <button
                      onClick={() => onRemoveAttachedImage(i)}
                      className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-white text-[10px] leading-none"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Describe the edit you want..."
              className="w-full resize-none rounded-lg border border-border bg-surface px-3 py-2 text-xs text-text-primary placeholder:text-text-tertiary outline-none focus:border-accent transition-colors"
              rows={3}
              disabled={!hasImage}
            />
            <div className="flex gap-2">
              <div className="relative">
                <button
                  ref={imgConfigBtnRef}
                  onClick={openConfig}
                  disabled={!hasImage}
                  className={`flex items-center justify-center gap-2 rounded-lg text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:opacity-50 disabled:pointer-events-none px-2.5 py-1 border ${
                    showImgConfig || editAspect || editSize
                      ? "border-accent text-accent"
                      : "border-border bg-surface text-text-primary hover:bg-bg-secondary"
                  }`}
                >
                  <Settings2 size={12} />
                </button>
                {showImgConfig && createPortal(
                  <div
                    className="fixed z-[100] w-52 rounded-xl border border-border bg-surface shadow-lg p-3 space-y-3"
                    style={{ top: configPos.top, left: configPos.left, transform: "translateY(-100%)" }}
                    ref={imgConfigRef}
                  >
                    <div>
                      <p className="text-[10px] font-medium text-text-secondary uppercase tracking-wider mb-1">Aspect Ratio</p>
                      <div className="flex flex-wrap gap-1">
                        {ASPECT_OPTS.map((o) => (
                          <button
                            key={o.value}
                            onClick={() => onSetEditAspect(o.value)}
                            className={`text-[10px] px-2 py-1 rounded ${
                              editAspect === o.value
                                ? "bg-accent text-white"
                                : "bg-bg-secondary text-text-secondary hover:bg-bg-tertiary"
                            }`}
                          >
                            {o.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-medium text-text-secondary uppercase tracking-wider mb-1">Image Size</p>
                      <div className="flex gap-1">
                        {SIZE_OPTS.map((o) => (
                          <button
                            key={o.value}
                            onClick={() => onSetEditSize(o.value)}
                            className={`text-[10px] px-2 py-1 rounded ${
                              editSize === o.value
                                ? "bg-accent text-white"
                                : "bg-bg-secondary text-text-secondary hover:bg-bg-tertiary"
                            }`}
                          >
                            {o.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>,
                  document.body
                )}
              </div>
              <Button size="sm" variant="secondary" onClick={onAttachImages} disabled={!hasImage}>
                <ImagePlus size={12} />
                Add ref
              </Button>
              <Button
                size="sm"
                onClick={handleAiSend}
                disabled={!hasImage || !aiPrompt.trim() || aiLoading}
              >
                {aiLoading ? (
                  <>
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Edit...
                  </>
                ) : (
                  <>
                    <Send size={12} />
                    Send
                  </>
                )}
              </Button>
            </div>
          </div>
        </CollapsibleSection>

        {/* Filters */}
        <CollapsibleSection title="Filters" icon={<Filter size={14} />}>
          <FilterControls selected={selectedFilter} onSelect={onFilterSelect} />
        </CollapsibleSection>

        {/* Crop */}
        <CollapsibleSection title="Crop" icon={<Crop size={14} />} defaultOpen={cropMode}>
          <div className="flex flex-col gap-2">
            {!cropMode ? (
              <Button size="sm" variant="secondary" onClick={onToggleCrop} disabled={!hasImage} className="w-full">
                <Crop size={12} />
                Enable Crop
              </Button>
            ) : (
              <>
                <p className="text-xs font-medium text-text-primary">Aspect ratio</p>
                <div className="flex flex-wrap gap-1">
                  {ASPECTS.map((a) => (
                    <button
                      key={a.key}
                      onClick={() => onSetCropAspect(a.key)}
                      className={`text-xs px-2 py-1 rounded transition-colors ${
                        cropAspect === a.key
                          ? "bg-accent text-white"
                          : "bg-bg-secondary text-text-secondary hover:bg-bg-tertiary"
                      }`}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 mt-1">
                  <Button size="sm" onClick={onApplyCrop} className="flex-1">
                    Apply
                  </Button>
                  <Button size="sm" variant="secondary" onClick={onCancelCrop}>
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </div>
        </CollapsibleSection>

        {/* Transform */}
        <CollapsibleSection title="Transform" icon={<RotateCcw size={14} />}>
          <div className="flex flex-col gap-2">
            <p className="text-xs text-text-secondary">Rotate</p>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => onRotate(90)} disabled={!hasImage}>
                ↻ 90°
              </Button>
              <Button size="sm" variant="secondary" onClick={() => onRotate(180)} disabled={!hasImage}>
                ↻ 180°
              </Button>
              <Button size="sm" variant="secondary" onClick={() => onRotate(270)} disabled={!hasImage}>
                ↺ 90°
              </Button>
            </div>
            <p className="text-xs text-text-secondary mt-1">Flip</p>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => onFlip(true)} disabled={!hasImage}>
                <FlipHorizontal size={12} />
                H
              </Button>
              <Button size="sm" variant="secondary" onClick={() => onFlip(false)} disabled={!hasImage}>
                <FlipHorizontal size={12} className="rotate-90" />
                V
              </Button>
            </div>
          </div>
        </CollapsibleSection>
      </div>

      {/* Bottom actions */}
      <div className="border-t border-border px-4 py-3">
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={onSave} disabled={!hasImage}>
            Save
          </Button>
          <Button variant="secondary" size="sm" onClick={onCopy} disabled={!hasImage}>
            Copy
          </Button>
        </div>
      </div>
    </div>
  );
}
