import { Download, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Button from "../common/Button";
import { saveImage } from "../../services/tauriCommands";
import { useUIStore } from "../../stores/uiStore";

// Module-level shared state for passing image between pages
export const editImageTransfer = { value: null as string | null };

interface ResultActionsProps {
  imageDataUrl: string;
  imageName?: string;
}

export default function ResultActions({ imageDataUrl, imageName }: ResultActionsProps) {
  const showToast = useUIStore((s) => s.showToast);
  const navigate = useNavigate();

  const handleDownload = async () => {
    try {
      await saveImage(imageDataUrl, imageName);
      showToast("Image saved!", "success");
    } catch {
      showToast("Failed to save image", "error");
    }
  };

  const handleEdit = () => {
    editImageTransfer.value = imageDataUrl;
    navigate("/edit");
  };

  return (
    <div className="flex items-center gap-2 mt-2">
      <Button variant="secondary" size="sm" onClick={handleEdit}>
        <Sparkles size={14} />
        Edit
      </Button>
      <Button variant="secondary" size="sm" onClick={handleDownload}>
        <Download size={14} />
        Save
      </Button>
    </div>
  );
}
