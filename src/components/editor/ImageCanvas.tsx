interface ImageCanvasProps {
  imageDataUrl: string;
  alt?: string;
  className?: string;
}

export default function ImageCanvas({
  imageDataUrl,
  alt,
  className,
}: ImageCanvasProps) {
  return (
    <div className={className}>
      <img
        src={imageDataUrl}
        alt={alt ?? "Image"}
        className="h-full w-full rounded-lg object-contain"
      />
    </div>
  );
}
