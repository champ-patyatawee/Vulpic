import type { PromptTemplate } from "../../types/template";
import Button from "../common/Button";

interface PromptTemplateListProps {
  templates: PromptTemplate[];
  onSelect: (template: PromptTemplate) => void;
}

const categoryLabels: Record<string, string> = {
  editing: "Editing",
  style: "Style Transfer",
  enhance: "Enhancement",
  effect: "Effects",
};

export default function PromptTemplateList({
  templates,
  onSelect,
}: PromptTemplateListProps) {
  const grouped = templates.reduce(
    (acc, t) => {
      const cat = t.category ?? "other";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(t);
      return acc;
    },
    {} as Record<string, PromptTemplate[]>
  );

  return (
    <div className="flex flex-col gap-3">
      {Object.entries(grouped).map(([category, items]) => (
        <div key={category}>
          <h4 className="mb-1.5 text-xs font-medium uppercase tracking-wider text-text-tertiary">
            {categoryLabels[category] ?? category}
          </h4>
          <div className="flex flex-wrap gap-2">
            {items.map((template) => (
              <Button
                key={template.id}
                variant="secondary"
                size="sm"
                onClick={() => onSelect(template)}
              >
                {template.label}
              </Button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
