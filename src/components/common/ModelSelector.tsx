import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search } from "lucide-react";
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
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const selectedModel = models.find((m) => m.id === selected);

  const filtered = search
    ? models.filter(
        (m) =>
          m.name.toLowerCase().includes(search.toLowerCase()) ||
          m.id.toLowerCase().includes(search.toLowerCase()) ||
          m.provider.toLowerCase().includes(search.toLowerCase())
      )
    : models;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (open && searchRef.current) {
      searchRef.current.focus();
    }
    if (!open) setSearch("");
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm text-text-primary hover:bg-bg-secondary transition-colors"
      >
        <span className="max-w-48 truncate">{selectedModel?.name ?? "Select model"}</span>
        <ChevronDown size={14} className={clsx("transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-80 rounded-lg border border-border bg-surface shadow-lg">
          {/* Search */}
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Search size={14} className="text-text-tertiary shrink-0" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search models..."
              className="flex-1 text-sm text-text-primary outline-none placeholder:text-text-tertiary bg-transparent"
            />
          </div>

          {/* List */}
          <div className="max-h-72 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-4 py-6 text-xs text-text-tertiary text-center">
                No models match "{search}"
              </p>
            ) : (
              filtered.map((model) => (
                <button
                  key={model.id}
                  onClick={() => {
                    onSelect(model.id);
                    setOpen(false);
                    setSearch("");
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
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
