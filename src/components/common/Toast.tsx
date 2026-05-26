import { useEffect } from "react";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";
import clsx from "clsx";
import { useUIStore } from "../../stores/uiStore";

export default function Toast() {
  const { toastMessage, toastType, clearToast } = useUIStore();

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(clearToast, 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage, clearToast]);

  if (!toastMessage) return null;

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
  };
  const Icon = icons[toastType];

  return (
    <div
      className={clsx(
        "fixed bottom-6 right-6 z-[100] flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg text-sm",
        toastType === "success" && "bg-success/10 text-success border border-success/20",
        toastType === "error" && "bg-danger/10 text-danger border border-danger/20",
        toastType === "info" && "bg-accent/10 text-accent border border-accent/20"
      )}
    >
      <Icon size={18} />
      <span>{toastMessage}</span>
      <button onClick={clearToast} className="ml-2 opacity-60 hover:opacity-100">
        <X size={16} />
      </button>
    </div>
  );
}
