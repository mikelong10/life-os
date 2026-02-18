import { useState, useCallback, useRef, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TimeSlotRow } from "./TimeSlotRow";
import { SlotEditor } from "./SlotEditor";
import { MultiSelectBar } from "./MultiSelectBar";
import { SLOTS_PER_DAY } from "@/lib/constants";

export function TimeGrid({ date }: { date: string }) {
  const slots = useQuery(api.timeSlots.getByDate, { date });
  const categories = useQuery(api.categories.list);
  const upsertSlot = useMutation(api.timeSlots.upsert);

  const [focusedSlot, setFocusedSlot] = useState<number>(0);
  const [selectedSlots, setSelectedSlots] = useState<Set<number>>(new Set());
  const [anchorSlot, setAnchorSlot] = useState<number | null>(null);
  const [editorSlot, setEditorSlot] = useState<number | null>(null);

  const gridRef = useRef<HTMLDivElement>(null);

  const slotMap = useMemo(() => {
    const map = new Map<number, Doc<"timeSlots">>();
    if (slots) {
      for (const slot of slots) {
        map.set(slot.slotIndex, slot);
      }
    }
    return map;
  }, [slots]);

  const categoryMap = useMemo(() => {
    const map = new Map<string, { name: string; color: string }>();
    if (categories) {
      for (const cat of categories) {
        map.set(cat._id, { name: cat.name, color: cat.color });
      }
    }
    return map;
  }, [categories]);

  const scrollSlotIntoView = useCallback((index: number) => {
    const row = gridRef.current?.querySelector(
      `[data-slot-index="${index}"]`
    );
    row?.scrollIntoView({ block: "nearest" });
  }, []);

  const handleSlotClick = useCallback((index: number) => {
    setSelectedSlots(new Set());
    setAnchorSlot(index);
    setFocusedSlot(index);
    setEditorSlot(index);
  }, []);

  const handleShiftClick = useCallback(
    (index: number) => {
      if (anchorSlot === null) {
        setAnchorSlot(index);
        setSelectedSlots(new Set([index]));
        return;
      }
      const start = Math.min(anchorSlot, index);
      const end = Math.max(anchorSlot, index);
      const newSelection = new Set<number>();
      for (let i = start; i <= end; i++) {
        newSelection.add(i);
      }
      setSelectedSlots(newSelection);
      setFocusedSlot(index);
    },
    [anchorSlot]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Don't handle keys if editor popover is open
      if (editorSlot !== null) return;

      switch (e.key) {
        case "ArrowUp": {
          e.preventDefault();
          const next = Math.max(0, focusedSlot - 1);
          setFocusedSlot(next);
          scrollSlotIntoView(next);
          if (e.shiftKey) {
            if (anchorSlot === null) setAnchorSlot(focusedSlot);
            const start = Math.min(anchorSlot ?? focusedSlot, next);
            const end = Math.max(anchorSlot ?? focusedSlot, next);
            const sel = new Set<number>();
            for (let i = start; i <= end; i++) sel.add(i);
            setSelectedSlots(sel);
          }
          break;
        }
        case "ArrowDown": {
          e.preventDefault();
          const next = Math.min(SLOTS_PER_DAY - 1, focusedSlot + 1);
          setFocusedSlot(next);
          scrollSlotIntoView(next);
          if (e.shiftKey) {
            if (anchorSlot === null) setAnchorSlot(focusedSlot);
            const start = Math.min(anchorSlot ?? focusedSlot, next);
            const end = Math.max(anchorSlot ?? focusedSlot, next);
            const sel = new Set<number>();
            for (let i = start; i <= end; i++) sel.add(i);
            setSelectedSlots(sel);
          }
          break;
        }
        case "Enter":
        case " ": {
          e.preventDefault();
          setEditorSlot(focusedSlot);
          break;
        }
        case "Escape": {
          e.preventDefault();
          if (selectedSlots.size > 0) {
            setSelectedSlots(new Set());
            setAnchorSlot(null);
          }
          break;
        }
        default: {
          // Number keys 1-9 for quick category assignment
          const num = parseInt(e.key);
          if (num >= 1 && num <= 9 && categories) {
            e.preventDefault();
            const cat = categories[num - 1];
            if (cat) {
              if (selectedSlots.size > 0) {
                // Bulk assign to selected slots
                const slots = Array.from(selectedSlots);
                for (const si of slots) {
                  upsertSlot({ date, slotIndex: si, categoryId: cat._id });
                }
                setSelectedSlots(new Set());
                setAnchorSlot(null);
              } else {
                // Assign to focused slot
                upsertSlot({
                  date,
                  slotIndex: focusedSlot,
                  categoryId: cat._id,
                });
              }
            }
          }
        }
      }
    },
    [
      focusedSlot,
      editorSlot,
      selectedSlots,
      anchorSlot,
      categories,
      date,
      upsertSlot,
      scrollSlotIntoView,
    ]
  );

  if (!slots || !categories) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-muted-foreground font-mono">Loading...</p>
      </div>
    );
  }

  return (
    <>
      <div
        ref={gridRef}
        tabIndex={0}
        role="grid"
        className="outline-none"
        onKeyDown={handleKeyDown}
        onFocus={() => {
          // Ensure focus ring is visible
        }}
      >
        <ScrollArea className="h-[calc(100vh-8rem)]">
          {Array.from({ length: SLOTS_PER_DAY }, (_, i) => {
            const slot = slotMap.get(i);
            const category = slot
              ? categoryMap.get(slot.categoryId) ?? null
              : undefined;

            const row = (
              <TimeSlotRow
                key={i}
                slotIndex={i}
                slot={slot}
                category={category}
                isFocused={focusedSlot === i}
                isSelected={selectedSlots.has(i)}
                onClick={() => handleSlotClick(i)}
                onShiftClick={() => handleShiftClick(i)}
              />
            );

            if (editorSlot === i) {
              return (
                <SlotEditor
                  key={`editor-${i}`}
                  date={date}
                  slotIndex={i}
                  currentCategoryId={slot?.categoryId}
                  currentNote={slot?.note}
                  slotId={slot?._id}
                  open={true}
                  onOpenChange={(open) => {
                    if (!open) setEditorSlot(null);
                  }}
                >
                  {row}
                </SlotEditor>
              );
            }

            return row;
          })}
        </ScrollArea>
      </div>
      <MultiSelectBar
        date={date}
        selectedSlots={selectedSlots}
        onClear={() => {
          setSelectedSlots(new Set());
          setAnchorSlot(null);
        }}
      />
    </>
  );
}
