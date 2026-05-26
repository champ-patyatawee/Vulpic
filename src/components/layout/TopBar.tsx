import { Image } from "lucide-react";
import clsx from "clsx";
import { useChatStore } from "../../stores/chatStore";
import { AVAILABLE_MODELS } from "../../types/model";
import ModelSelector from "../common/ModelSelector";

interface TopBarProps {
  onToggleGallery?: () => void;
  galleryOpen?: boolean;
}

export default function TopBar({ onToggleGallery, galleryOpen }: TopBarProps) {
  const currentModel = useChatStore((s) => s.currentModel);
  const setCurrentModel = useChatStore((s) => s.setCurrentModel);

  return (
    <header className="flex items-center justify-between border-b border-border bg-bg-primary px-6 py-3">
      <div className="flex items-center gap-3">
        <ModelSelector
          models={AVAILABLE_MODELS}
          selected={currentModel}
          onSelect={setCurrentModel}
        />
      </div>
      <div className="flex items-center gap-2">
        {onToggleGallery && (
          <button
            onClick={onToggleGallery}
            className={clsx(
              "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
              galleryOpen
                ? "bg-accent/10 text-accent"
                : "text-text-secondary hover:bg-bg-secondary hover:text-text-primary"
            )}
            title="Gallery"
          >
            <Image size={18} />
          </button>
        )}
        <span className="text-sm text-text-secondary">v0.1.0</span>
      </div>
    </header>
  );
}
