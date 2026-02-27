import { useMemo } from "react";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import { SLOTS_PER_DAY } from "@/lib/constants";
import { slotIndexToTimeRange } from "@/lib/slotUtils";
import { cn } from "@/lib/utils";

import type { Doc } from "../../../convex/_generated/dataModel";

const TIME_LABELS: { slotIndex: number; label: string }[] = [
  { slotIndex: 0, label: "12am" },
  { slotIndex: 12, label: "6am" },
  { slotIndex: 24, label: "12pm" },
  { slotIndex: 36, label: "6pm" },
];

export function DayTimelineStrip({
  slots,
  categories,
}: {
  slots: Doc<"timeSlots">[];
  categories: Doc<"categories">[];
}) {
  const isMobile = useIsMobile();

  const slotMap = useMemo(() => {
    const map = new Map<number, Doc<"timeSlots">>();
    for (const slot of slots) {
      map.set(slot.slotIndex, slot);
    }
    return map;
  }, [slots]);

  const categoryMap = useMemo(() => {
    const map = new Map<string, { name: string; color: string }>();
    for (const cat of categories) {
      map.set(cat._id, { name: cat.name, color: cat.color });
    }
    return map;
  }, [categories]);

  const presentCategories = useMemo(() => {
    const seen = new Map<string, { name: string; color: string }>();
    for (const slot of slots) {
      const cat = categoryMap.get(slot.categoryId);
      if (cat && !seen.has(slot.categoryId)) {
        seen.set(slot.categoryId, cat);
      }
    }
    return Array.from(seen.values());
  }, [slots, categoryMap]);

  if (slots.length === 0) {
    return (
      <div className="text-muted-foreground flex h-32 items-center justify-center font-mono text-sm">
        No data for this period
      </div>
    );
  }

  const visibleLabels = isMobile ? TIME_LABELS.filter((l) => l.slotIndex !== 36) : TIME_LABELS;

  return (
    <TooltipProvider delayDuration={100}>
      <div className="border-border flex h-8 overflow-hidden rounded-md border">
        {Array.from({ length: SLOTS_PER_DAY }, (_, i) => {
          const slot = slotMap.get(i);
          const cat = slot ? categoryMap.get(slot.categoryId) : undefined;
          return (
            <Tooltip key={i}>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "h-full flex-1 transition-opacity hover:opacity-80",
                    !cat && "bg-muted",
                  )}
                  style={cat ? { backgroundColor: cat.color } : undefined}
                />
              </TooltipTrigger>
              <TooltipContent side="top" className="font-mono text-xs">
                <div className="font-semibold">{slotIndexToTimeRange(i)}</div>
                <div>{cat?.name ?? "Unassigned"}</div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      <div className="relative mt-1 h-5">
        {visibleLabels.map(({ slotIndex, label }) => (
          <span
            key={slotIndex}
            className={cn(
              "text-muted-foreground absolute font-mono text-xs",
              slotIndex === 0 ? "translate-x-0" : "-translate-x-1/2",
            )}
            style={{ left: `${(slotIndex / SLOTS_PER_DAY) * 100}%` }}
          >
            {label}
          </span>
        ))}
      </div>

      {presentCategories.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
          {presentCategories.map((cat) => (
            <div key={cat.name} className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ backgroundColor: cat.color }}
              />
              <span className="text-muted-foreground font-mono text-xs">{cat.name}</span>
            </div>
          ))}
        </div>
      )}
    </TooltipProvider>
  );
}
