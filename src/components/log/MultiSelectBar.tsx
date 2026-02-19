import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { CategoryPicker } from "@/components/categories/CategoryPicker";
import { X } from "lucide-react";

export function MultiSelectBar({
  date,
  selectedSlots,
  onClear,
}: {
  date: string;
  selectedSlots: Set<number>;
  onClear: () => void;
}) {
  const bulkAssign = useMutation(api.timeSlots.bulkAssign);

  const handleAssign = async (categoryId: Id<"categories">) => {
    await bulkAssign({
      date,
      slotIndexes: Array.from(selectedSlots),
      categoryId,
    });
    onClear();
  };

  if (selectedSlots.size < 2) return null;

  return (
    <div className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] left-1/2 z-40 -translate-x-1/2 rounded-lg border bg-card p-4 shadow-lg">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-sm font-mono font-medium">
          {selectedSlots.size} slots selected
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs"
          onClick={onClear}
        >
          <X className="h-3 w-3 mr-1" />
          Clear
        </Button>
      </div>
      <CategoryPicker onSelect={handleAssign} className="w-72" />
    </div>
  );
}
