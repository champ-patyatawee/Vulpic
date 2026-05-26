import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import clsx from "clsx";
import type { AIModel, ModelId } from "../../types/model";

interface ModelSelectorProps {
  models: AIModel[];
  selected: ModelId;
  onSelect: (id: ModelId) => void;
}

export default function ModelSelector({
  models,
  selected,
  onSelect,
}: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selectedModel = models.find((m) => m.id === selected);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm text-text-primary hover:bg-bg-secondary transition-colors"
      >
        <span>{selectedModel?.name ?? "Select model"}</span>
        <ChevronDown size={14} className={clsx("transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-lg border border-border bg-white shadow-lg">
          {models.map((model) => (
            <button
              key={model.id}
              onClick={() => {
                onSelect(model.id);
                setOpen(false);
              }}
              className={clsx(
                "flex w-full flex-col gap-0.5 px-4 py-2.5 text-left transition-colors hover:bg-bg-secondary",
                model.id === selected && "bg-accent/5"
              )}
            >
              <span className="text-sm font-medium text-text-primary">
                {model.name}
              </span>
              <span className="text-xs text-text-secondary line-clamp-2">
                {model.provider} — {model.description}
              </span>
              <span className="text-xs text-text-tertiary mt-0.5">
                {model.pricing}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
