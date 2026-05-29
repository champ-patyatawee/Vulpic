import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, ImagePlus } from "lucide-react";
import TopBar from "../components/layout/TopBar";
import { useSettingsStore } from "../stores/settingsStore";
import { useUIStore } from "../stores/uiStore";
import { generateImage, editImage } from "../services/openrouter";
import ResultActions from "../components/editor/ResultActions";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text?: string;
  imageUrl?: string;
  refImages?: { dataUrl: string; name: string }[];
}

export default function Generate() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [refImages, setRefImages] = useState<{ dataUrl: string; name: string }[]>([]);
  const showToast = useUIStore((s) => s.showToast);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    for (const file of files) {
      const reader = new FileReader();
      reader.onload = () => setRefImages((prev) => [...prev, { dataUrl: reader.result as string, name: file.name }]);
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async () => {
    const text = prompt.trim();
    if (!text && refImages.length === 0) return;

    const apiKey = useSettingsStore.getState().apiKey;
    if (!apiKey) {
      showToast("Set your OpenRouter API key in Settings", "error");
      return;
    }

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: text || undefined,
      refImages: refImages.length > 0 ? [...refImages] : undefined,
    };
    setMessages((prev) => [...prev, userMsg]);
    setPrompt("");
    setRefImages([]);
    setLoading(true);

    try {
      const modelId = useSettingsStore.getState().defaultModel;
      const resultUrl = refImages.length > 0
        ? await editImage(apiKey, modelId, refImages[0].dataUrl, text, refImages.slice(1).map((r) => r.dataUrl))
        : await generateImage(apiKey, modelId, text);
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "assistant", imageUrl: resultUrl }]);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Generation failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <TopBar />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-text-tertiary">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                <Sparkles size={28} />
              </div>
              <p className="text-sm">Describe the image you want to create</p>
            </div>
          )}

          <div className="mx-auto max-w-2xl space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "user" ? (
                  <div className="max-w-[75%] space-y-2">
                    {msg.refImages && msg.refImages.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 justify-end">
                        {msg.refImages.map((img, i) => (
                          <img key={i} src={img.dataUrl} alt="" className="h-12 w-12 rounded-lg border border-white/30 object-cover" />
                        ))}
                      </div>
                    )}
                    {msg.text && (
                      <div className="rounded-2xl bg-accent px-4 py-2.5 text-sm text-white">
                        {msg.text}
                      </div>
                    )}
                  </div>
                ) : msg.imageUrl ? (
                  <div className="max-w-md rounded-xl border border-border bg-white p-3 shadow-sm">
                    <img
                      src={msg.imageUrl}
                      alt="Generated"
                      className="w-full rounded-lg object-contain"
                      style={{ maxHeight: "50vh" }}
                    />
                    <div className="mt-2 flex justify-end">
                      <ResultActions imageDataUrl={msg.imageUrl} />
                    </div>
                  </div>
                ) : null}
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl bg-bg-secondary px-4 py-3">
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                  <span className="text-xs text-text-secondary">Generating...</span>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </div>

        {/* Input */}
        <div className="border-t border-border bg-bg-primary px-4 py-4">
          <div className="mx-auto flex max-w-2xl flex-col gap-2">
            {/* Ref image thumbnails */}
            {refImages.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {refImages.map((img, i) => (
                  <div key={i} className="relative h-12 w-12">
                    <img src={img.dataUrl} alt="" className="h-full w-full rounded-lg border border-border object-cover" />
                    <button
                      onClick={() => setRefImages((prev) => prev.filter((_, j) => j !== i))}
                      className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-white text-[10px] leading-none"
                    >×</button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => fileRef.current?.click()}
                className="flex h-10 w-10 shrink-0 items-center justify-center self-end rounded-xl border border-border text-text-tertiary hover:bg-bg-secondary hover:text-text-primary transition-colors"
                title="Attach reference image"
              >
                <ImagePlus size={18} />
              </button>
              <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleAttach} />

              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={refImages.length > 0 ? "Describe the edit you want..." : "Describe the image you want to create..."}
                className="flex-1 resize-none rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                rows={1}
                style={{ minHeight: 42, maxHeight: 120 }}
                disabled={loading}
                onInput={(e) => {
                  const el = e.currentTarget;
                  el.style.height = "auto";
                  el.style.height = Math.min(el.scrollHeight, 120) + "px";
                }}
              />
              <button
                onClick={handleSend}
                disabled={loading || (!prompt.trim() && refImages.length === 0)}
                className="flex h-10 w-10 shrink-0 items-center justify-center self-end rounded-xl bg-accent text-white hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
