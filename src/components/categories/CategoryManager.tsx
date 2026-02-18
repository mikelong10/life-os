import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id, Doc } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { CATEGORY_PALETTE } from "@/lib/constants";
import { Trash2, Plus, GripVertical } from "lucide-react";

export function CategoryManager() {
  const categories = useQuery(api.categories.list);
  const allCategories = useQuery(api.categories.listAll);
  const createCategory = useMutation(api.categories.create);
  const updateCategory = useMutation(api.categories.update);
  const archiveCategory = useMutation(api.categories.archive);
  const [newName, setNewName] = useState("");

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

  const handleArchive = async (id: Id<"categories">) => {
    await archiveCategory({ id });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        {categories.map((cat: Doc<"categories">) => (
          <div
            key={cat._id}
            className="flex items-center gap-2 rounded-md border bg-card px-3 py-2"
          >
            <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground cursor-grab" />
            <span
              className="h-4 w-4 shrink-0 rounded-sm"
              style={{ backgroundColor: cat.color }}
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
