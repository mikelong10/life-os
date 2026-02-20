import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id, Doc } from "../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { getCategoryShortcutLabel } from "@/lib/categoryShortcuts";

export function CategoryPicker({
  onSelect,
  selectedId,
  className,
  maxVisibleRows,
}: {
  onSelect: (categoryId: Id<"categories">) => void;
  selectedId?: Id<"categories"> | null;
  className?: string;
  maxVisibleRows?: number;
}) {
  const categories = useQuery(api.categories.list);

  if (!categories) return null;

  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-1.5",
        maxVisibleRows && "overflow-y-auto",
        className
      )}
      style={
        maxVisibleRows
          ? {
              // Each button row: ~34px (py-1.5 padding + text + border) + 6px gap
              maxHeight: `${maxVisibleRows * 34 + (maxVisibleRows - 1) * 6}px`,
            }
          : undefined
      }
    >
      {categories.map((cat: Doc<"categories">, index: number) => {
        const label = getCategoryShortcutLabel(index);
        return (
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
            {label !== null && (
              <kbd className="ml-auto shrink-0 rounded border bg-muted px-1 text-xs text-muted-foreground font-mono">
                {label}
              </kbd>
            )}
          </button>
        );
      })}
    </div>
  );
}
