import { History, RotateCcw } from "lucide-react";
import Button from "../common/Button";

interface HistoryEntry {
  id: string;
  label: string;
}

interface EditHistoryProps {
  entries: HistoryEntry[];
  onRestore: (id: string) => void;
}

export default function EditHistory({ entries, onRestore }: EditHistoryProps) {
  if (entries.length === 0) return null;

  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex items-center gap-2 text-sm font-medium text-text-primary mb-2">
        <History size={16} />
        Edit History
      </div>
      <div className="flex flex-col gap-1">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="flex items-center justify-between rounded px-2 py-1.5 text-sm text-text-secondary hover:bg-bg-secondary"
          >
            <span>{entry.label}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRestore(entry.id)}
            >
              <RotateCcw size={12} />
              Restore
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
