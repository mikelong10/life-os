import { useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id, Doc } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CATEGORY_PALETTE } from "@/lib/constants";
import { Trash2, Plus, GripVertical, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function CategoryManager() {
  const categories = useQuery(api.categories.list);
  const allCategories = useQuery(api.categories.listAll);
  const createCategory = useMutation(api.categories.create);
  const updateCategory = useMutation(api.categories.update);
  const archiveCategory = useMutation(api.categories.archive);
  const reorderCategories = useMutation(api.categories.reorder);
  const [newName, setNewName] = useState("");

  // Drag state
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const dragRef = useRef<number | null>(null);

  if (!categories || !allCategories) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground font-mono">Loading categories...</p>
      </div>
    );
  }

  const usedColors = new Set(allCategories.map((c: { color: string }) => c.color));
  const nextColor =
    CATEGORY_PALETTE.find((c) => !usedColors.has(c)) ?? CATEGORY_PALETTE[0];

  const handleAdd = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    await createCategory({
      name: trimmed,
      color: nextColor,
      sortOrder: categories.length,
    });
    setNewName("");
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

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = "move";
    dragRef.current = index;
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setOverIndex(index);
  };

  const handleDragEnd = async () => {
    if (dragIndex !== null && overIndex !== null && dragIndex !== overIndex) {
      const reordered = getReorderedList();
      const orderedIds = reordered.map((c) => c._id);
      await reorderCategories({ orderedIds });
    }
    setDragIndex(null);
    setOverIndex(null);
    dragRef.current = null;
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
    dragIndex !== null && overIndex !== null ? getReorderedList() : (categories as Doc<"categories">[]);

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        {displayList.map((cat, index) => (
          <div
            key={cat._id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={cn(
              "flex items-center gap-2 rounded-md border bg-card px-3 py-2 transition-opacity",
              dragIndex === index && overIndex !== null && dragIndex !== overIndex && "opacity-40"
            )}
          >
            <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground cursor-grab active:cursor-grabbing" />
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
            {index < 9 && (
              <kbd className="shrink-0 rounded border bg-muted px-1 text-xs text-muted-foreground font-mono tabular-nums">
                {index + 1}
              </kbd>
            )}
            <div className="flex shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                onClick={() => handleMove(index, -1)}
                disabled={index === 0}
              >
                <ChevronUp className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                onClick={() => handleMove(index, 1)}
                disabled={index >= categories.length - 1}
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => handleArchive(cat._id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>
      <Separator />
      <div className="flex items-center gap-2">
        <span
          className="h-4 w-4 shrink-0 rounded-sm"
          style={{ backgroundColor: nextColor }}
        />
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New category name..."
          className="h-8 font-mono text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd();
          }}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={handleAdd}
          disabled={!newName.trim()}
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add
        </Button>
      </div>
    </div>
  );
}

function ColorPicker({
  color,
  onChange,
}: {
  color: string;
  onChange: (color: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="h-4 w-4 shrink-0 rounded-sm border border-border/50 cursor-pointer hover:ring-2 hover:ring-ring/30 transition-shadow"
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
                c === color
                  ? "border-foreground ring-2 ring-ring"
                  : "border-border/50"
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
