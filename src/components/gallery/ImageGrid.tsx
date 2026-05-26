import type { GalleryImage } from "../../types/image";
import ImageCard from "./ImageCard";

interface ImageGridProps {
  images: GalleryImage[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function ImageGrid({
  images,
  selectedId,
  onSelect,
}: ImageGridProps) {
  if (images.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-text-secondary">
            No images yet. Open a folder to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {images.map((image) => (
        <ImageCard
          key={image.id}
          image={image}
          selected={image.id === selectedId}
          onClick={() => onSelect(image.id)}
        />
      ))}
    </div>
  );
}
