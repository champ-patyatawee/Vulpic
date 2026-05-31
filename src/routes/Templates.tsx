import { useState, useRef, useEffect } from "react";
import {
  Loader2, Download, Copy, Check,
  Image, PenTool, Palette, BarChart3, Package, Megaphone,
} from "lucide-react";
import TopBar from "../components/layout/TopBar";
import { useSettingsStore } from "../stores/settingsStore";
import { useUIStore } from "../stores/uiStore";
import { useSavedTemplatesStore } from "../stores/savedTemplatesStore";
import { generateChatCompletion, generateImage } from "../services/openrouter";
import { TEMPLATE_TYPES } from "../data/templateCategories";

const iconMap: Record<string, React.ReactNode> = {
  Image: <Image size={22} />,
  PenTool: <PenTool size={22} />,
  Palette: <Palette size={22} />,
  BarChart3: <BarChart3 size={22} />,
  Package: <Package size={22} />,
  Megaphone: <Megaphone size={22} />,
};

export default function Templates() {
  const apiKey = useSettingsStore((s) => s.apiKey);
  const catModels = useSettingsStore((s) => s.templateModel);
  const genModel = useSettingsStore((s) => s.defaultModel);
  const showToast = useUIStore((s) => s.showToast);
  const saved = useSavedTemplatesStore((s) => s.saved);
  const addSaved = useSavedTemplatesStore((s) => s.addSaved);

  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Close preview on Escape
  useEffect(() => {
    if (!previewUrl) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setPreviewUrl(null); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [previewUrl]);

  const handleGenerate = async (tpl: typeof TEMPLATE_TYPES[0]) => {
    if (!apiKey) {
      showToast("Set your OpenRouter API key in Settings", "error");
      return;
    }

    const resultId = crypto.randomUUID();
    setGeneratingId(resultId);

    // Add placeholder immediately
    addSaved({
      id: resultId,
      prompt: "Generating...",
      dataUrl: "",
      categoryName: tpl.name,
      itemName: tpl.name,
      createdAt: Date.now(),
    });

    try {
      // Step 1: Generate prompt
      const systemPrompt = "You are a professional graphic design prompt engineer. Generate exactly 1 detailed image generation prompt. Return ONLY the prompt text, no numbering or prefixes.";
      const text = await generateChatCompletion(apiKey, catModels, systemPrompt, tpl.promptInstruction);
      const prompt = text.replace(/^\d+[\.\)]\s*/, "").trim();

      // Update with prompt
      useSavedTemplatesStore.getState().addSaved({
        id: resultId,
        prompt: prompt || tpl.promptInstruction,
        dataUrl: "",
        categoryName: tpl.name,
        itemName: tpl.name,
        createdAt: Date.now(),
      });
      // Actually, we need to update, not add again. Remove old + add new.
      useSavedTemplatesStore.getState().removeSaved(resultId);
      useSavedTemplatesStore.getState().addSaved({
        id: resultId,
        prompt: prompt || tpl.promptInstruction,
        dataUrl: "",
        categoryName: tpl.name,
        itemName: tpl.name,
        createdAt: Date.now(),
      });

      // Step 2: Generate image
      try {
        const url = await generateImage(apiKey, genModel, prompt || tpl.promptInstruction);
        useSavedTemplatesStore.getState().removeSaved(resultId);
        addSaved({
          id: resultId,
          prompt: prompt || tpl.promptInstruction,
          dataUrl: url,
          categoryName: tpl.name,
          itemName: tpl.name,
          createdAt: Date.now(),
        });
      } catch {
        useSavedTemplatesStore.getState().removeSaved(resultId);
        addSaved({
          id: resultId,
          prompt: prompt || tpl.promptInstruction,
          dataUrl: "",
          categoryName: tpl.name,
          itemName: tpl.name,
          createdAt: Date.now(),
        });
        showToast("Image generation failed", "error");
      }
    } catch {
      useSavedTemplatesStore.getState().removeSaved(resultId);
      addSaved({
        id: resultId,
        prompt: "Generation failed",
        dataUrl: "",
        categoryName: tpl.name,
        itemName: tpl.name,
        createdAt: Date.now(),
      });
      showToast("Prompt generation failed", "error");
    } finally {
      setGeneratingId(null);
      resultsRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleCopyPrompt = async (prompt: string, id: string) => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopiedId(id);
      showToast("Prompt copied!", "success");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      showToast("Failed to copy", "error");
    }
  };

  const handleSaveImage = async (dataUrl: string, tplName: string) => {
    if (!dataUrl) return;
    try {
      const { saveImage } = await import("../services/tauriCommands");
      await saveImage(dataUrl, `${tplName.toLowerCase().replace(/\s+/g, "-")}.png`);
      showToast("Image saved!", "success");
    } catch {
      showToast("Failed to save", "error");
    }
  };

  return (
    <>
      <TopBar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          {/* Header */}
          <div className="px-6 py-5 border-b border-border">
            <h1 className="text-lg font-medium text-text-primary">Templates</h1>
            <p className="text-sm text-text-secondary mt-0.5">Click any template to instantly generate a design</p>
          </div>

          {/* Template cards grid */}
          <div className="px-6 py-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {TEMPLATE_TYPES.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => handleGenerate(tpl)}
                  disabled={generatingId !== null}
                  className="flex flex-col items-center gap-2.5 p-5 rounded-xl border border-border bg-white hover:bg-bg-secondary hover:shadow-sm transition-all text-center disabled:opacity-50"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${tpl.color}18`, color: tpl.color }}
                  >
                    {iconMap[tpl.icon] || tpl.icon}
                  </div>
                  <span className="text-sm font-medium text-text-primary">{tpl.name}</span>
                  <span className="text-[11px] text-text-tertiary leading-tight">{tpl.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Results (all from store) */}
          {saved.length > 0 && (
            <div ref={resultsRef} className="border-t border-border px-6 py-5">
              <h2 className="text-sm font-medium text-text-primary mb-4">Generated Templates ({saved.length})</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {saved.map((r) => (
                  <div key={r.id} className="rounded-xl border border-border bg-white overflow-hidden">
                    {/* Image */}
                    <div className="aspect-[4/5] bg-bg-secondary relative flex items-center justify-center overflow-hidden">
                      {generatingId === r.id && !r.dataUrl ? (
                        <div className="flex flex-col items-center gap-2 text-text-tertiary">
                          <Loader2 size={22} className="animate-spin" />
                          <span className="text-xs">{r.prompt === "Generating..." ? "Creating prompt..." : "Generating image..."}</span>
                        </div>
                      ) : r.dataUrl ? (
                        <>
                          <img
                            src={r.dataUrl}
                            alt={r.itemName}
                            className="w-full h-full object-cover cursor-pointer"
                            onClick={() => setPreviewUrl(r.dataUrl)}
                          />
                          <button
                            onClick={() => handleSaveImage(r.dataUrl, r.itemName)}
                            className="absolute bottom-2 right-2 bg-white/90 backdrop-blur rounded-lg px-3 py-1.5 text-xs font-medium text-text-primary hover:bg-white transition-colors flex items-center gap-1.5 shadow-sm"
                          >
                            <Download size={12} />
                            Save Image
                          </button>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-text-tertiary">
                          <span className="text-xl">⚠️</span>
                          <span className="text-xs">{r.prompt}</span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium text-text-secondary uppercase tracking-wide">{r.categoryName}</span>
                        {r.prompt && r.prompt !== "Generating..." && r.prompt !== "Generation failed" && (
                          <button
                            onClick={() => handleCopyPrompt(r.prompt, r.id)}
                            className="flex items-center gap-1 text-xs text-text-tertiary hover:text-accent transition-colors"
                            title="Copy prompt"
                          >
                            {copiedId === r.id ? <Check size={12} /> : <Copy size={12} />}
                            {copiedId === r.id ? "Copied" : "Copy"}
                          </button>
                        )}
                      </div>
                      {r.prompt && r.prompt !== "Generating..." && (
                        <p className="text-xs text-text-secondary leading-relaxed line-clamp-3">{r.prompt}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image preview modal */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setPreviewUrl(null)}
        >
          <div className="relative max-h-full max-w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={previewUrl}
              alt="Preview"
              className="max-h-[90vh] max-w-[90vw] rounded-xl shadow-2xl object-contain"
            />
            <button
              onClick={() => setPreviewUrl(null)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center text-sm text-text-primary hover:bg-bg-secondary transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
}
