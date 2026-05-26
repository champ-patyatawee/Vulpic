import { useState, useRef, useEffect } from "react";
import { Send, Image as ImageIcon, X } from "lucide-react";
import clsx from "clsx";

interface PromptBarProps {
  onSend: (text: string, images?: { dataUrl: string; name: string }[]) => void;
  disabled?: boolean;
  initialPrompt?: string;
  initialImages?: { dataUrl: string; name: string }[];
}

export default function PromptBar({
  onSend,
  disabled,
  initialPrompt,
  initialImages,
}: PromptBarProps) {
  const [text, setText] = useState(initialPrompt ?? "");
  const [images, setImages] = useState<{ dataUrl: string; name: string }[]>(
    initialImages ?? [],
  );
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync external initialPrompt changes
  useEffect(() => {
    if (initialPrompt !== undefined) setText(initialPrompt);
  }, [initialPrompt]);

  // Sync external initialImages changes
  useEffect(() => {
    if (initialImages !== undefined) setImages(initialImages);
  }, [initialImages]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed && images.length === 0) return;
    onSend(trimmed, images.length > 0 ? images : undefined);
    setText("");
    setImages([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = Array.from(e.target.files ?? []);
    if (fileList.length === 0) return;

    // Reset input immediately so same file(s) can be picked again
    e.target.value = "";

    for (const file of fileList) {
      const reader = new FileReader();
      reader.onload = () => {
        setImages((prev) => [
          ...prev,
          { dataUrl: reader.result as string, name: file.name },
        ]);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="border-t border-border bg-bg-primary px-6 py-4">
      <div className="mx-auto flex max-w-3xl flex-col gap-2">
        {/* Image preview row */}
        {images.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {images.map((img, i) => (
              <div key={i} className="relative inline-block">
                <img
                  src={img.dataUrl}
                  alt={img.name}
                  className="h-16 w-16 rounded-lg border border-border object-cover"
                />
                <button
                  onClick={() => removeImage(i)}
                  className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-white text-xs shadow"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2">
          {/* Image attach button */}
          <button
            onClick={() => inputRef.current?.click()}
            className={clsx(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition-colors",
              images.length > 0
                ? "border-accent text-accent bg-accent/5"
                : "border-border text-text-tertiary hover:bg-bg-secondary hover:text-text-primary"
            )}
            title="Attach image"
          >
            <ImageIcon size={18} />
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Text input */}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              images.length > 0
                ? "Describe the edit you want..."
                : "Drop an image or type a prompt..."
            }
            rows={1}
            className="flex-1 resize-none rounded-lg border border-border bg-white px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
            style={{ minHeight: 40, maxHeight: 120 }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = "auto";
              el.style.height = Math.min(el.scrollHeight, 120) + "px";
            }}
          />

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={disabled || (!text.trim() && images.length === 0)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-white hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Send"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
