import { useState, useCallback, useRef, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";
import type { Id } from "../../../convex/_generated/dataModel";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CategoryPicker } from "@/components/categories/CategoryPicker";
import { TimeSlotRow } from "./TimeSlotRow";
import { MultiSelectBar } from "./MultiSelectBar";
import { SLOTS_PER_DAY } from "@/lib/constants";
import { slotIndexToTimeRange } from "@/lib/slotUtils";
import { X } from "lucide-react";

export function TimeGrid({ date }: { date: string }) {
  const slots = useQuery(api.timeSlots.getByDate, { date });
  const categories = useQuery(api.categories.list);
  const upsertSlot = useMutation(api.timeSlots.upsert);
  const removeSlot = useMutation(api.timeSlots.remove);
  const updateNote = useMutation(api.timeSlots.updateNote);

  const [focusedSlot, setFocusedSlot] = useState<number>(0);
  const [selectedSlots, setSelectedSlots] = useState<Set<number>>(new Set());
  const [anchorSlot, setAnchorSlot] = useState<number | null>(null);
  const [editorSlot, setEditorSlot] = useState<number | null>(null);
  const [note, setNote] = useState("");

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

  const activeSlot = editorSlot !== null ? slotMap.get(editorSlot) : undefined;
  const activeCategoryId = activeSlot?.categoryId;

  const scrollSlotIntoView = useCallback((index: number) => {
    const row = gridRef.current?.querySelector(
      `[data-slot-index="${index}"]`
    );
    row?.scrollIntoView({ block: "nearest" });
  }, []);

  const openEditor = useCallback(
    (index: number) => {
      const slot = slotMap.get(index);
      setNote(slot?.note ?? "");
      setEditorSlot(index);
    },
    [slotMap]
  );

  const closeEditor = useCallback(() => {
    setEditorSlot(null);
  }, []);

  const handleSlotClick = useCallback(
    (index: number) => {
      setSelectedSlots(new Set());
      setAnchorSlot(index);
      setFocusedSlot(index);
      openEditor(index);
    },
    [openEditor]
  );

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

  const handleCategorySelect = useCallback(
    async (categoryId: Id<"categories">) => {
      if (editorSlot === null) return;
      await upsertSlot({
        date,
        slotIndex: editorSlot,
        categoryId,
        note: note || undefined,
      });
      closeEditor();
    },
    [editorSlot, date, note, upsertSlot, closeEditor]
  );

  const handleClearSlot = useCallback(async () => {
    if (editorSlot === null) return;
    await removeSlot({ date, slotIndex: editorSlot });
    closeEditor();
  }, [editorSlot, date, removeSlot, closeEditor]);

  const handleNoteBlur = useCallback(async () => {
    if (!activeSlot) return;
    if (note !== (activeSlot.note ?? "")) {
      await updateNote({ id: activeSlot._id, note });
    }
  }, [activeSlot, note, updateNote]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (editorSlot !== null) {
        if (e.key === "Escape") {
          e.preventDefault();
          closeEditor();
        }
        return;
      }

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
          openEditor(focusedSlot);
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
          const num = parseInt(e.key);
          if (num >= 1 && num <= 9 && categories) {
            e.preventDefault();
            const cat = categories[num - 1];
            if (cat) {
              if (selectedSlots.size > 0) {
                const slots = Array.from(selectedSlots);
                for (const si of slots) {
                  upsertSlot({ date, slotIndex: si, categoryId: cat._id });
                }
                setSelectedSlots(new Set());
                setAnchorSlot(null);
              } else {
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
      openEditor,
      closeEditor,
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
      <div className="flex h-full">
        {/* Grid */}
        <div
          ref={gridRef}
          tabIndex={0}
          role="grid"
          className="flex-1 min-w-0 outline-none"
          onKeyDown={handleKeyDown}
        >
          <ScrollArea className="h-[calc(100vh-8rem)]">
            {Array.from({ length: SLOTS_PER_DAY }, (_, i) => {
              const slot = slotMap.get(i);
              const category = slot
                ? categoryMap.get(slot.categoryId) ?? null
                : undefined;

              return (
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
            })}
          </ScrollArea>
        </div>

        {/* Editor side panel */}
        {editorSlot !== null && (
          <div className="w-72 shrink-0 border-l bg-card">
            <div className="flex items-center justify-between border-b px-3 py-2">
              <span className="text-xs font-mono text-muted-foreground">
                {slotIndexToTimeRange(editorSlot)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={closeEditor}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="p-3 space-y-3">
              <CategoryPicker
                onSelect={handleCategorySelect}
                selectedId={activeCategoryId}
              />
              <div className="space-y-1.5">
                <Label className="text-xs font-mono text-muted-foreground">
                  Note
                </Label>
                <Input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  onBlur={handleNoteBlur}
                  placeholder="What were you doing?"
                  className="h-8 text-sm font-mono"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      (e.target as HTMLInputElement).blur();
                    }
                  }}
                />
              </div>
              {activeCategoryId && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-full text-xs text-muted-foreground hover:text-destructive"
                  onClick={handleClearSlot}
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear slot
                </Button>
              )}
            </div>
          </div>
        )}
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
