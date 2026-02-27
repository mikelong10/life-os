import { useQuery, useMutation } from "convex/react";
import { Trash2, Plus, GripVertical, ChevronUp, ChevronDown } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { useSortable } from "@/hooks/use-sortable";
import { getCategoryShortcutLabel } from "@/lib/categoryShortcuts";
import { CATEGORY_PALETTE, getNextCategoryColor } from "@/lib/constants";
import { cn } from "@/lib/utils";

import { api } from "../../../convex/_generated/api";
import type { Id, Doc } from "../../../convex/_generated/dataModel";

export function CategoryManager() {
  const categories = useQuery(api.categories.list);
  const allCategories = useQuery(api.categories.listAll);
  const createCategory = useMutation(api.categories.create);
  const updateCategory = useMutation(api.categories.update);
  const archiveCategory = useMutation(api.categories.archive);
  const reorderCategories = useMutation(api.categories.reorder);
  const [newName, setNewName] = useState("");
  const [newColorOverride, setNewColorOverride] = useState<string | null>(null);

  const handleSortReorder = async (fromIndex: number, toIndex: number) => {
    if (!categories) return;
    const items = [...categories] as Doc<"categories">[];
    const [moved] = items.splice(fromIndex, 1);
    items.splice(toIndex, 0, moved);
    const orderedIds = items.map((c) => c._id);
    await reorderCategories({ orderedIds });
  };

  const { dragIndex, overIndex, isDragging, handlePointerDown } = useSortable({
    itemCount: categories?.length ?? 0,
    onReorder: handleSortReorder,
    getLabel: getCategoryShortcutLabel,
  });

  if (!categories || !allCategories) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground font-mono text-sm">Loading categories...</p>
      </div>
    );
  }

  const usedColors = allCategories.map((c: { color: string }) => c.color);
  const autoColor = getNextCategoryColor(usedColors);
  const newColor = newColorOverride ?? autoColor;

  const handleAdd = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    await createCategory({
      name: trimmed,
      color: newColor,
      sortOrder: categories.length,
    });
    setNewName("");
    setNewColorOverride(null);
  };

  const handleRename = async (id: Id<"categories">, name: string) => {
    await updateCategory({ id, name });
  };

  const handleColorChange = async (id: Id<"categories">, color: string) => {
    await updateCategory({ id, color });
  };

  const handleArchive = async (id: Id<"categories">) => {
    await archiveCategory({ id });
  };

  const getReorderedList = () => {
    if (dragIndex === null || overIndex === null || dragIndex === overIndex)
      return categories as Doc<"categories">[];
    const items = [...categories] as Doc<"categories">[];
    const [moved] = items.splice(dragIndex, 1);
    items.splice(overIndex, 0, moved);
    return items;
  };

  const handleMove = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= categories.length) return;
    const items = [...categories] as Doc<"categories">[];
    const [moved] = items.splice(index, 1);
    items.splice(target, 0, moved);
    const orderedIds = items.map((c) => c._id);
    await reorderCategories({ orderedIds });
  };

  const displayList =
    dragIndex !== null && overIndex !== null
      ? getReorderedList()
      : (categories as Doc<"categories">[]);

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        {displayList.map((cat, index) => (
          <div
            key={cat._id}
            data-sortable-index={index}
            className={cn(
              "bg-card flex items-center gap-2 rounded-md border px-3 py-2",
              isDragging && dragIndex !== overIndex && index === overIndex && "opacity-40",
            )}
          >
            <GripVertical
              className="text-muted-foreground h-4 w-4 shrink-0 cursor-grab touch-none active:cursor-grabbing"
              onPointerDown={(e) => handlePointerDown(index, e)}
            />
            <ColorPicker
              color={cat.color}
              onChange={(color) => handleColorChange(cat._id, color)}
            />
            <Input
              defaultValue={cat.name}
              className="h-7 border-0 bg-transparent px-1 font-mono text-sm shadow-none focus-visible:ring-0"
              onBlur={(e) => {
                const val = e.target.value.trim();
                if (val && val !== cat.name) {
                  handleRename(cat._id, val);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  (e.target as HTMLInputElement).blur();
                }
              }}
            />
            {(() => {
              const label = getCategoryShortcutLabel(index);
              return label !== null ? (
                <kbd className="bg-muted text-muted-foreground shrink-0 rounded border px-1 font-mono text-xs tabular-nums">
                  {label}
                </kbd>
              ) : null;
            })()}
            <div className="flex shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground h-6 w-6"
                onClick={() => handleMove(index, -1)}
                disabled={index === 0}
              >
                <ChevronUp className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground h-6 w-6"
                onClick={() => handleMove(index, 1)}
                disabled={index >= categories.length - 1}
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive h-7 w-7 shrink-0"
              onClick={() => handleArchive(cat._id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>
      <Separator />
      <div className="flex items-center gap-2">
        <ColorPicker color={newColor} onChange={setNewColorOverride} />
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New category name..."
          className="h-8 font-mono text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd();
          }}
        />
        <Button variant="outline" size="sm" onClick={handleAdd} disabled={!newName.trim()}>
          <Plus className="mr-1 h-3.5 w-3.5" />
          Add
        </Button>
      </div>
    </div>
  );
}

function ColorPicker({ color, onChange }: { color: string; onChange: (color: string) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="border-border/50 hover:ring-ring/30 h-4 w-4 shrink-0 cursor-pointer rounded-sm border transition-shadow hover:ring-2"
          style={{ backgroundColor: color }}
        />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="start">
        <div className="grid grid-cols-5 gap-1.5">
          {CATEGORY_PALETTE.map((c) => (
            <button
              key={c}
              className={cn(
                "h-6 w-6 rounded-sm border transition-transform hover:scale-110",
                c === color ? "border-foreground ring-ring ring-2" : "border-border/50",
              )}
              style={{ backgroundColor: c }}
              onClick={() => {
                onChange(c);
                setOpen(false);
              }}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
