import { useRef } from "react";
import { Image } from "lucide-react";

interface ImageInputProps {
  preview: string | null;
  onClear: () => void;
  onImage: (dataUrl: string, name: string) => void;
}

export default function ImageInput({ preview, onClear, onImage }: ImageInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onImage(reader.result as string, file.name);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      {preview ? (
        <div className="relative inline-block">
          <img
            src={preview}
            alt="Preview"
            className="h-20 w-20 rounded-lg border border-border object-cover"
          />
          <button
            onClick={onClear}
            className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-white text-xs"
          >
            ×
          </button>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-border text-text-tertiary hover:bg-bg-secondary hover:text-text-primary transition-colors"
          title="Attach image"
        >
          <Image size={18} />
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
