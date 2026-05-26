import { useCallback, useState } from "react";

interface UseImageDropReturn {
  droppedImage: string | null;
  droppedImageName: string | null;
  handleDrop: (dataUrl: string, name: string) => void;
  clearDropped: () => void;
}

export function useImageDrop(): UseImageDropReturn {
  const [droppedImage, setDroppedImage] = useState<string | null>(null);
  const [droppedImageName, setDroppedImageName] = useState<string | null>(null);

  const handleDrop = useCallback((dataUrl: string, name: string) => {
    setDroppedImage(dataUrl);
    setDroppedImageName(name);
  }, []);

  const clearDropped = useCallback(() => {
    setDroppedImage(null);
    setDroppedImageName(null);
  }, []);

  return { droppedImage, droppedImageName, handleDrop, clearDropped };
}
