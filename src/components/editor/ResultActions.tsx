import { Download, Copy, Check, Sparkles } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../common/Button";
import { saveImage } from "../../services/tauriCommands";
import { useUIStore } from "../../stores/uiStore";

interface ResultActionsProps {
  imageDataUrl: string;
  imageName?: string;
}

export default function ResultActions({ imageDataUrl, imageName }: ResultActionsProps) {
  const [copied, setCopied] = useState(false);
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

  const handleCopy = async () => {
    try {
      const res = await fetch(imageDataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob }),
      ]);
      setCopied(true);
      showToast("Copied to clipboard!", "success");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast("Failed to copy", "error");
    }
  };

  const handleEdit = () => {
    navigate("/editor", { state: { imageDataUrl } });
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
      <Button variant="secondary" size="sm" onClick={handleCopy}>
        {copied ? <Check size={14} /> : <Copy size={14} />}
        {copied ? "Copied!" : "Copy"}
      </Button>
    </div>
  );
}
