import clsx from "clsx";
import type { GalleryImage } from "../../types/image";

interface ImageStripProps {
  images: GalleryImage[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function ImageStrip({ images, selectedId, onSelect }: ImageStripProps) {
  if (images.length === 0) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 text-xs text-text-tertiary">
        No images. Open a folder to get started.
      </div>
    );
  }

  return (
    <div className="flex gap-2 overflow-x-auto px-4 py-3">
      {images.map((img) => (
        <button
          key={img.id}
          onClick={() => onSelect(img.id)}
          className={clsx(
            "h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-all",
            img.id === selectedId
              ? "border-accent ring-1 ring-accent"
              : "border-border hover:border-text-tertiary"
          )}
        >
          <img
            src={img.dataUrl}
            alt={img.name}
            className="h-full w-full object-cover"
          />
        </button>
      ))}
    </div>
  );
}
