import clsx from "clsx";

const FILTERS: { key: string; label: string; css: string }[] = [
  { key: "original",   label: "Original", css: "" },
  { key: "clarendon",  label: "Clarendon", css: "brightness(1.15) contrast(1.2) saturate(1.3)" },
  { key: "gingham",    label: "Gingham",   css: "sepia(0.3) contrast(1.05) brightness(1.1) saturate(0.8)" },
  { key: "lark",       label: "Lark",      css: "brightness(1.1) contrast(0.9) saturate(0.8) hue-rotate(-5deg)" },
  { key: "valencia",   label: "València",  css: "sepia(0.4) contrast(1.05) brightness(1.08) saturate(0.9) hue-rotate(5deg)" },
  { key: "walden",     label: "Walden",    css: "brightness(1.05) saturate(0.7) sepia(0.15) hue-rotate(-10deg)" },
  { key: "xpro2",      label: "X-Pro II",  css: "contrast(1.3) brightness(0.95) saturate(0.6) sepia(0.2)" },
  { key: "juno",       label: "Juno",      css: "brightness(1.05) contrast(1.1) saturate(1.6) hue-rotate(8deg)" },
  { key: "lofi",       label: "Lo-Fi",     css: "contrast(1.25) brightness(0.95) saturate(1.1) sepia(0.1)" },
  { key: "inkwell",    label: "Inkwell",   css: "grayscale(1) contrast(1.3) brightness(1.05)" },
];

interface FilterControlsProps {
  selected: string;
  onSelect: (key: string, css: string) => void;
}

export default function FilterControls({ selected, onSelect }: FilterControlsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {FILTERS.map((f) => (
        <button
          key={f.key}
          onClick={() => onSelect(f.key, f.css)}
          className={clsx(
            "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
            selected === f.key
              ? "border-accent bg-accent/10 text-accent"
              : "border-border text-text-secondary hover:bg-bg-secondary hover:text-text-primary",
          )}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}

export { FILTERS };
