import { useCallback, useRef, useState } from "react";
import { Upload } from "lucide-react";
import clsx from "clsx";

interface DropZoneProps {
  onImage: (dataUrl: string, name: string) => void;
  className?: string;
}

export default function DropZone({ onImage, className }: DropZoneProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) {
        readFile(file);
      }
    },
    [onImage]
  );

  const handleFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        readFile(file);
      }
    },
    [onImage]
  );

  function readFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      onImage(reader.result as string, file.name);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={clsx(
        "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors",
        dragging
          ? "border-accent bg-accent/5"
          : "border-border hover:border-text-tertiary hover:bg-bg-secondary",
        className
      )}
    >
      <Upload
        size={32}
        className={clsx("mb-3", dragging ? "text-accent" : "text-text-tertiary")}
      />
      <p className="text-sm text-text-secondary">
        {dragging ? "Drop image here" : "Drop image or click to browse"}
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}
