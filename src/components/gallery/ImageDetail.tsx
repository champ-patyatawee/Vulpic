import type { GalleryImage } from "../../types/image";
import PromptTemplateList from "./PromptTemplateList";
import type { PromptTemplate } from "../../types/template";

interface ImageDetailProps {
  image: GalleryImage;
  fullDataUrl?: string;
  templates: PromptTemplate[];
  onApplyTemplate: (template: PromptTemplate) => void;
}

export default function ImageDetail({
  image,
  fullDataUrl,
  templates,
  onApplyTemplate,
}: ImageDetailProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Large preview */}
      <div className="overflow-hidden rounded-xl border border-border bg-white">
        <img
          src={fullDataUrl ?? image.dataUrl}
          alt={image.name}
          className="max-h-[50vh] w-full object-contain"
        />
      </div>

      {/* Image info */}
      <div className="text-sm text-text-secondary">
        <p className="font-medium text-text-primary">{image.name}</p>
        <p>
          {image.width} × {image.height}
        </p>
      </div>

      {/* Prompt templates */}
      <div>
        <h3 className="mb-2 text-sm font-medium text-text-primary">
          Quick edits
        </h3>
        <PromptTemplateList
          templates={templates}
          onSelect={onApplyTemplate}
        />
      </div>
    </div>
  );
}
