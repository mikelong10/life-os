import { memo } from "react";

import { slotIndexToTime } from "@/lib/slotUtils";
import { cn } from "@/lib/utils";

import type { Doc } from "../../../convex/_generated/dataModel";

interface TimeSlotRowProps {
  slotIndex: number;
  slot?: Doc<"timeSlots">;
  category?: { name: string; color: string } | null;
  isFocused: boolean;
  isSelected: boolean;
  onClick: () => void;
  onShiftClick: () => void;
}

export const TimeSlotRow = memo(function TimeSlotRow({
  slotIndex,
  slot,
  category,
  isFocused,
  isSelected,
  onClick,
  onShiftClick,
}: TimeSlotRowProps) {
  const timeLabel = slotIndexToTime(slotIndex);
  const isFilled = !!slot && !!category;

  const handleClick = (e: React.MouseEvent) => {
    if (e.shiftKey) {
      e.preventDefault();
      onShiftClick();
    } else {
      onClick();
    }
  };

  return (
    <div
      role="row"
      tabIndex={-1}
      data-slot-index={slotIndex}
      onClick={handleClick}
      className={cn(
        "flex max-w-full cursor-pointer items-center gap-3 overflow-hidden border-b px-3 py-1.5 transition-colors",
        "hover:bg-accent/50",
        isFocused && "ring-primary ring-1 ring-inset",
        isSelected && "bg-primary/10",
      )}
    >
      <span className="text-muted-foreground w-20 shrink-0 font-mono text-xs tabular-nums">
        {timeLabel}
      </span>
      {isFilled ? (
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span
            className="h-full w-1 shrink-0 self-stretch rounded-full"
            style={{ backgroundColor: category.color, minHeight: "1.25rem" }}
          />
          <span className="shrink-0 font-mono text-sm">{category.name}</span>
          {slot.note && (
            <span className="text-muted-foreground truncate font-mono text-xs">· {slot.note}</span>
          )}
        </div>
      ) : (
        <div className="border-border/50 h-5 flex-1 rounded-md border border-dashed" />
      )}
    </div>
  );
});
