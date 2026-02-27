import { useMutation } from "convex/react";
import { X } from "lucide-react";

import { CategoryPicker } from "@/components/categories/CategoryPicker";
import { Button } from "@/components/ui/button";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

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
  const bulkRemove = useMutation(api.timeSlots.bulkRemove);

  const handleAssign = async (categoryId: Id<"categories">) => {
    await bulkAssign({
      date,
      slotIndexes: Array.from(selectedSlots),
      categoryId,
    });
    onClear();
  };

  const handleClearAssignments = async () => {
    await bulkRemove({
      date,
      slotIndexes: Array.from(selectedSlots),
    });
    onClear();
  };

  if (selectedSlots.size < 2) return null;

  return (
    <div className="bg-card fixed bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] left-1/2 z-40 -translate-x-1/2 rounded-lg border p-4 shadow-lg">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="font-mono text-sm font-medium">{selectedSlots.size} slots selected</span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={handleClearAssignments}
          >
            Clear
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClear}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
      <CategoryPicker onSelect={handleAssign} className="w-72" />
    </div>
  );
}
