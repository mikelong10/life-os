import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id, Doc } from "../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";

export function CategoryPicker({
  onSelect,
  selectedId,
  className,
}: {
  onSelect: (categoryId: Id<"categories">) => void;
  selectedId?: Id<"categories"> | null;
  className?: string;
}) {
  const categories = useQuery(api.categories.list);

  if (!categories) return null;

  return (
    <div className={cn("grid grid-cols-2 gap-1.5", className)}>
      {categories.map((cat: Doc<"categories">, index: number) => (
        <button
          key={cat._id}
          onClick={() => onSelect(cat._id)}
          className={cn(
            "flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-left text-sm font-mono transition-colors",
            "hover:bg-accent",
            selectedId === cat._id
              ? "border-primary bg-accent"
              : "border-transparent"
          )}
        >
          <span
            className="h-3 w-3 shrink-0 rounded-sm"
            style={{ backgroundColor: cat.color }}
          />
          <span className="truncate">{cat.name}</span>
          {index < 10 && (
            <kbd className="ml-auto shrink-0 rounded border bg-muted px-1 text-xs text-muted-foreground font-mono">
              {index}
            </kbd>
          )}
        </button>
      ))}
    </div>
  );
}
