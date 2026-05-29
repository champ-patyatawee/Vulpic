import { useState, useMemo } from "react";
import { Copy, Check, ExternalLink, BookOpen, ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import { PROMPT_LIBRARY } from "../data/promptLibrary";
import mooslPrompts from "../data/prompts.json";
import wuyoscarPrompts from "../data/prompts_wuyoscar.json";
import youmindPrompts from "../data/prompts_youmind.json";
import evolinkPrompts from "../data/prompts_evolink.json";

// Merge all data sources, deduplicate by image URL, only keep items with images
const PROMPT_DATA = (() => {
  const seenUrls = new Set<string>();
  const merged: (typeof mooslPrompts)[number][] = [];

  for (const data of [mooslPrompts, wuyoscarPrompts, youmindPrompts, evolinkPrompts, PROMPT_LIBRARY]) {
    for (const e of data) {
      if (e.imageUrl && !seenUrls.has(e.imageUrl)) {
        seenUrls.add(e.imageUrl);
        merged.push(e as any);
      }
    }
  }

  return merged;
})();

const ITEMS_PER_PAGE = 20;

const CATEGORIES = ["All", ...new Set(PROMPT_DATA.map((p) => p.category))];

export default function Library() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  const handleImageError = (url: string) => {
    setFailedImages((prev) => new Set(prev).add(url));
  };

  // Filter and sort: items with images first
  const filtered = useMemo(() => {
    const items = activeCategory === "All"
      ? PROMPT_DATA
      : PROMPT_DATA.filter((p) => p.category === activeCategory);
    return [...items].sort((a, b) => a.title.localeCompare(b.title));
  }, [activeCategory]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const currentItems = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  // Reset to page 1 when category changes
  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    setPage(1);
  };

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const totalImages = filtered.length;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="border-b border-border px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-accent" />
            <h1 className="text-lg font-medium text-text-primary">Prompt Library</h1>
          </div>
          <span className="text-xs text-text-tertiary">
            {filtered.length} prompts ({totalImages} with images)
          </span>
        </div>
        <p className="mt-1 text-xs text-text-secondary">
          <a href="https://github.com/moosl/awsome-gpt-image-2-prompts" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">moosl</a>
          {" · "}
          <a href="https://github.com/wuyoscar/GPT-Image2-Skill" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">wuyoscar</a>
          {" · "}
          <a href="https://github.com/YouMind-OpenLab/awesome-nano-banana-pro-prompts" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">YouMind (Nano Banana)</a>
          {" · "}
          <a href="https://github.com/YouMind-OpenLab/awesome-gpt-image-2" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">YouMind (GPT-2)</a>
          {" · "}
          <a href="https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">EvoLinkAI</a>
          {" · 5 repos total"}
        </p>
      </header>

      {/* Category filters */}
      <div className="flex gap-2 overflow-x-auto border-b border-border px-6 py-3">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategoryChange(cat)}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              activeCategory === cat
                ? "bg-accent text-white"
                : "bg-bg-secondary text-text-secondary hover:bg-bg-tertiary"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-6xl">
          {currentItems.length === 0 && (
            <p className="text-sm text-text-secondary">No prompts in this category.</p>
          )}

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {currentItems.map((entry) => {
              const isExpanded = expandedId === entry.id;
              const isCopied = copiedId === entry.id;
              const imgFailed = failedImages.has(entry.imageUrl);

              return (
                <div
                  key={entry.id}
                  className="flex flex-col overflow-hidden rounded-xl border border-border bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="block aspect-[4/3] overflow-hidden bg-bg-secondary">
                    {imgFailed ? (
                      <div className="flex h-full items-center justify-center flex-col gap-1 text-text-tertiary">
                        <ImageOff size={20} />
                        <span className="text-xs">No preview</span>
                      </div>
                    ) : (
                      <a href={entry.sourceUrl} target="_blank" rel="noopener noreferrer" className="block h-full w-full">
                        <img
                          src={entry.imageUrl}
                          alt={entry.title}
                          className="h-full w-full object-cover transition-transform hover:scale-105"
                          loading="lazy"
                          onError={() => handleImageError(entry.imageUrl)}
                        />
                      </a>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <span className="self-start rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-medium text-accent">
                      {entry.category}
                    </span>

                    <h3 className="text-sm font-medium text-text-primary leading-snug line-clamp-2">
                      {entry.title}
                    </h3>

                    {/* Prompt */}
                    <div className="relative flex-1">
                      <pre className={`whitespace-pre-wrap break-words text-xs text-text-secondary leading-relaxed font-sans ${isExpanded ? "" : "line-clamp-4"}`}>
                        {entry.prompt}
                      </pre>
                      {entry.prompt.length > 300 && (
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                          className="mt-1 text-xs text-accent hover:underline"
                        >
                          {isExpanded ? "Show less" : "Show more"}
                        </button>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
                      <a
                        href={entry.authorUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-text-tertiary hover:text-accent transition-colors"
                      >
                        {entry.author}
                        <ExternalLink size={10} />
                      </a>

                      <button
                        onClick={() => handleCopy(entry.id, entry.prompt)}
                        className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-text-secondary hover:bg-bg-secondary hover:text-text-primary transition-colors"
                      >
                        {isCopied ? (
                          <><Check size={12} className="text-green-600" /> Copied</>
                        ) : (
                          <><Copy size={12} /> Copy</>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-3">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs text-text-secondary hover:bg-bg-secondary disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={14} />
                Previous
              </button>

              <span className="text-xs text-text-secondary">
                Page {page} of {totalPages}
              </span>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs text-text-secondary hover:bg-bg-secondary disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
