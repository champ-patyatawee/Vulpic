import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, ImagePlus, Trash2, Settings2 } from "lucide-react";
import TopBar from "../components/layout/TopBar";
import { useSettingsStore } from "../stores/settingsStore";
import { useUIStore } from "../stores/uiStore";
import { useChatStore } from "../stores/chatStore";
import { generateImage, editImage } from "../services/openrouter";
import type { ImageConfig } from "../services/openrouter";
import ResultActions from "../components/editor/ResultActions";
import type { Message } from "../types/message";

const ASPECT_OPTIONS = [
  { value: "", label: "Auto" },
  { value: "1:1", label: "1:1" },
  { value: "16:9", label: "16:9" },
  { value: "9:16", label: "9:16" },
  { value: "4:3", label: "4:3" },
  { value: "3:4", label: "3:4" },
  { value: "4:5", label: "4:5" },
  { value: "3:2", label: "3:2" },
  { value: "2:3", label: "2:3" },
];

const SIZE_OPTIONS = [
  { value: "", label: "Auto" },
  { value: "0.5K", label: "0.5K" },
  { value: "1K", label: "1K" },
  { value: "2K", label: "2K" },
  { value: "4K", label: "4K" },
];

export default function Generate() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [refImages, setRefImages] = useState<{ dataUrl: string; name: string }[]>([]);
  const [aspectRatio, setAspectRatio] = useState("");
  const [imageSize, setImageSize] = useState("");
  const [showConfig, setShowConfig] = useState(false);
  const configRef = useRef<HTMLDivElement>(null);
  const showToast = useUIStore((s) => s.showToast);
  const messages = useChatStore((s) => {
    const conv = s.conversations.find((c) => c.id === s.activeConversationId);
    return conv?.messages ?? [];
  });
  const addMessage = useChatStore((s) => s.addMessage);
  const updateMessage = useChatStore((s) => s.updateMessage);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Ensure there is an active conversation on mount
  useEffect(() => {
    const state = useChatStore.getState();
    if (!state.activeConversationId) {
      state.createConversation();
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Close config popover on click outside
  useEffect(() => {
    if (!showConfig) return;
    const handler = (e: MouseEvent) => {
      if (configRef.current && !configRef.current.contains(e.target as Node)) {
        setShowConfig(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showConfig]);

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

    // Ensure we have an active conversation
    let convId = useChatStore.getState().activeConversationId;
    if (!convId) {
      convId = useChatStore.getState().createConversation();
    }

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: [
        ...refImages.map((img) => ({ type: "image" as const, dataUrl: img.dataUrl, name: img.name })),
        ...(text ? [{ type: "text" as const, text }] : []),
      ],
      createdAt: Date.now(),
    };
    addMessage(convId, userMsg);

    // Add a placeholder "Generating..." message that gets replaced on completion
    const loadingMsgId = crypto.randomUUID();
    const now = Date.now();
    addMessage(convId, {
      id: loadingMsgId,
      role: "assistant",
      content: [{ type: "text", text: "Generating image..." }],
      createdAt: now,
    });

    setPrompt("");
    setRefImages([]);
    setLoading(true);

    try {
      const modelId = useSettingsStore.getState().defaultModel;
      const imgConfig: ImageConfig = {};
      if (aspectRatio) imgConfig.aspect_ratio = aspectRatio;
      if (imageSize) imgConfig.image_size = imageSize;

      const resultUrl = refImages.length > 0
        ? await editImage(apiKey, modelId, refImages[0].dataUrl, text, refImages.slice(1).map((r) => r.dataUrl), imgConfig)
        : await generateImage(apiKey, modelId, text, imgConfig);
      updateMessage(convId, loadingMsgId, {
        id: loadingMsgId,
        role: "assistant",
        content: [{ type: "image", dataUrl: resultUrl, name: `vulpic-${Date.now()}` }],
        createdAt: now,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Generation failed";
      updateMessage(convId, loadingMsgId, {
        id: loadingMsgId,
        role: "assistant",
        content: [{ type: "text", text: `Error: ${errorMsg}` }],
        createdAt: now,
      });
      showToast(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    const state = useChatStore.getState();
    if (state.activeConversationId) {
      state.deleteConversation(state.activeConversationId);
    }
    state.createConversation();
  };

  return (
    <>
      <TopBar>
        {messages.length > 0 && (
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 text-xs text-text-tertiary hover:text-danger transition-colors"
            title="Clear chat history"
          >
            <Trash2 size={14} />
            Clear history
          </button>
        )}
      </TopBar>
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
                    {msg.content.filter((c) => c.type === "image").length > 0 && (
                      <div className="flex flex-wrap gap-1.5 justify-end">
                        {msg.content.filter((c) => c.type === "image").map((img, i) => (
                          <img key={i} src={img.dataUrl} alt={img.name ?? ""} className="h-12 w-12 rounded-lg border border-white/30 object-cover" />
                        ))}
                      </div>
                    )}
                    {msg.content.filter((c) => c.type === "text").map((c, i) => (
                      <div key={i} className="rounded-2xl bg-accent px-4 py-2.5 text-sm text-white">
                        {c.text}
                      </div>
                    ))}
                  </div>
                ) : (() => {
                  const imgContent = msg.content.find((c) => c.type === "image");
                  if (imgContent) {
                    return (
                      <div className="max-w-md rounded-xl border border-border bg-surface p-3 shadow-sm">
                        <img
                          src={imgContent.dataUrl}
                          alt="Generated"
                          className="w-full rounded-lg object-contain"
                          style={{ maxHeight: "50vh" }}
                        />
                        <div className="mt-2 flex justify-end">
                          <ResultActions imageDataUrl={imgContent.dataUrl} />
                        </div>
                      </div>
                    );
                  }
                  const txtContent = msg.content.find((c) => c.type === "text");
                  if (txtContent) {
                    return (
                      <div className="rounded-2xl bg-bg-secondary px-4 py-2.5 text-sm text-text-primary">
                        {txtContent.text}
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            ))}

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

            <div className="flex flex-col gap-2">
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

              {/* Textarea - fixed 5 rows, scrollable */}
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
                className="w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                rows={5}
                disabled={loading}
              />

              {/* Toolbar row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {/* Config icon */}
                  <div className="relative" ref={configRef}>
                    <button
                      onClick={() => setShowConfig(!showConfig)}
                      className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${
                        showConfig || aspectRatio || imageSize
                          ? "border-accent text-accent bg-accent/5"
                          : "border-border text-text-tertiary hover:bg-bg-secondary hover:text-text-primary"
                      }`}
                      title="Image settings"
                    >
                      <Settings2 size={15} />
                    </button>
                    {showConfig && (
                      <div className="absolute bottom-full left-0 mb-2 z-50 w-56 rounded-xl border border-border bg-surface shadow-lg p-3 space-y-3">
                        <div>
                          <p className="text-[11px] font-medium text-text-secondary uppercase tracking-wider mb-1.5">Aspect Ratio</p>
                          <div className="flex flex-wrap gap-1">
                            {ASPECT_OPTIONS.map((o) => (
                              <button
                                key={o.value}
                                onClick={() => setAspectRatio(o.value)}
                                className={`text-[11px] px-2 py-1 rounded ${
                                  aspectRatio === o.value
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
                          <p className="text-[11px] font-medium text-text-secondary uppercase tracking-wider mb-1.5">Image Size</p>
                          <div className="flex gap-1">
                            {SIZE_OPTIONS.map((o) => (
                              <button
                                key={o.value}
                                onClick={() => setImageSize(o.value)}
                                className={`text-[11px] px-2 py-1 rounded ${
                                  imageSize === o.value
                                    ? "bg-accent text-white"
                                    : "bg-bg-secondary text-text-secondary hover:bg-bg-tertiary"
                                }`}
                              >
                                {o.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Attach image */}
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-text-tertiary hover:bg-bg-secondary hover:text-text-primary transition-colors"
                    title="Attach reference image"
                  >
                    <ImagePlus size={16} />
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleAttach} />
                </div>

                {/* Send button */}
                <button
                  onClick={handleSend}
                  disabled={loading || (!prompt.trim() && refImages.length === 0)}
                  className="flex h-9 items-center gap-1.5 rounded-lg bg-accent text-white px-4 hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                  <Send size={15} />
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
