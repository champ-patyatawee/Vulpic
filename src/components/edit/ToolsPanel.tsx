import { useState } from "react";
import { ChevronDown, ChevronRight, Send, Sparkles, Filter, Zap, ImagePlus } from "lucide-react";
import type { PromptTemplate } from "../../types/template";
import FilterControls from "../editor/FilterControls";
import PromptTemplateList from "../gallery/PromptTemplateList";
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
  templates: PromptTemplate[];
  onApplyTemplate: (template: PromptTemplate) => void;
  onSave: () => void;
  onCopy: () => void;
}

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
  templates,
  onApplyTemplate,
  onSave,
  onCopy,
}: ToolsPanelProps) {
  const [aiPrompt, setAiPrompt] = useState("");

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
            {/* Attached reference images */}
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
              className="w-full resize-none rounded-lg border border-border bg-white px-3 py-2 text-xs text-text-primary placeholder:text-text-tertiary outline-none focus:border-accent transition-colors"
              rows={3}
              disabled={!hasImage}
            />
            <div className="flex gap-2">
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

        {/* Quick Edits */}
        {templates.length > 0 && (
          <CollapsibleSection title="Quick Edits" icon={<Zap size={14} />}>
            <PromptTemplateList
              templates={templates}
              onSelect={onApplyTemplate}
            />
          </CollapsibleSection>
        )}
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
