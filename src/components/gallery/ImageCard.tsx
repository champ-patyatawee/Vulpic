import clsx from "clsx";
import type { GalleryImage } from "../../types/image";

interface ImageCardProps {
  image: GalleryImage;
  selected: boolean;
  onClick: () => void;
}

export default function ImageCard({ image, selected, onClick }: ImageCardProps) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "group relative aspect-square overflow-hidden rounded-lg border-2 transition-all",
        selected
          ? "border-accent ring-2 ring-accent/30"
          : "border-border hover:border-text-tertiary"
      )}
    >
      <img
        src={image.dataUrl}
        alt={image.name}
        className="h-full w-full object-cover"
        loading="lazy"
      />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <p className="truncate text-xs text-white">{image.name}</p>
      </div>
    </button>
  );
}
