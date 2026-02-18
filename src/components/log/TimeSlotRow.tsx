import { memo } from "react";
import type { Doc } from "../../../convex/_generated/dataModel";
import { slotIndexToTime } from "@/lib/slotUtils";
import { cn } from "@/lib/utils";
import { StickyNote } from "lucide-react";

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
        "flex items-center gap-3 border-b px-3 py-1.5 cursor-pointer transition-colors",
        "hover:bg-accent/50",
        isFocused && "ring-1 ring-primary ring-inset",
        isSelected && "bg-primary/10"
      )}
    >
      <span className="w-20 shrink-0 text-xs font-mono text-muted-foreground tabular-nums">
        {timeLabel}
      </span>
      {isFilled ? (
        <div className="flex flex-1 items-center gap-2 min-w-0">
          <span
            className="h-full w-1 self-stretch rounded-full shrink-0"
            style={{ backgroundColor: category.color, minHeight: "1.25rem" }}
          />
          <span className="text-sm font-mono truncate">{category.name}</span>
          {slot.note && (
            <StickyNote className="h-3 w-3 shrink-0 text-muted-foreground" />
          )}
        </div>
      ) : (
        <div className="flex-1 border border-dashed border-border/50 rounded-md h-5" />
      )}
    </div>
  );
});
