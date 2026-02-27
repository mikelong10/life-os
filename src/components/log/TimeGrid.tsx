import { useQuery, useMutation } from "convex/react";
import { X } from "lucide-react";
import { useState, useCallback, useRef, useMemo, useEffect } from "react";

import { CategoryPicker } from "@/components/categories/CategoryPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDragSelect } from "@/hooks/use-drag-select";
import { useIsMobile } from "@/hooks/use-mobile";
import { getCategoryIndexFromKey } from "@/lib/categoryShortcuts";
import { SLOTS_PER_DAY } from "@/lib/constants";
import { slotIndexToTimeRange } from "@/lib/slotUtils";
import { cn } from "@/lib/utils";

import { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";
import type { Id } from "../../../convex/_generated/dataModel";
import { MultiSelectBar } from "./MultiSelectBar";
import { TimeSlotRow } from "./TimeSlotRow";

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

  const isMobile = useIsMobile();
  const gridRef = useRef<HTMLDivElement>(null);
  const bottomPanelRef = useRef<HTMLDivElement>(null);
  const [bottomPanelHeight, setBottomPanelHeight] = useState(0);

  // Track whether we need to scroll on the next panel height update
  const pendingScrollSlotRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isMobile || editorSlot === null || !bottomPanelRef.current) {
      setBottomPanelHeight(0);
      return;
    }
    const el = bottomPanelRef.current;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const height = entry.contentRect.height;
        setBottomPanelHeight(height);
        // Scroll the pending slot into view now that panel height is known
        if (pendingScrollSlotRef.current !== null) {
          const slotIndex = pendingScrollSlotRef.current;
          pendingScrollSlotRef.current = null;
          requestAnimationFrame(() => {
            const row = gridRef.current?.querySelector(
              `[data-slot-index="${slotIndex}"]`,
            ) as HTMLElement | null;
            const viewport = gridRef.current?.querySelector(
              '[data-slot="scroll-area-viewport"]',
            ) as HTMLElement | null;
            if (!row || !viewport) return;
            const visibleHeight = viewport.clientHeight - height;
            viewport.scrollTop = row.offsetTop - visibleHeight + row.offsetHeight;
          });
        }
      }
    });
    observer.observe(el);
    setBottomPanelHeight(el.offsetHeight);
    return () => observer.disconnect();
  }, [isMobile, editorSlot]);

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

  const scrollSlotIntoView = useCallback(
    (index: number) => {
      const row = gridRef.current?.querySelector(
        `[data-slot-index="${index}"]`,
      ) as HTMLElement | null;
      const viewport = gridRef.current?.querySelector(
        '[data-slot="scroll-area-viewport"]',
      ) as HTMLElement | null;
      if (!row || !viewport) return;

      const rowTop = row.offsetTop;
      const rowHeight = row.offsetHeight;
      const viewportHeight = viewport.clientHeight;

      if (isMobile) {
        // Position the slot just above the bottom panel
        const visibleHeight = viewportHeight - bottomPanelHeight;
        viewport.scrollTop = rowTop - visibleHeight + rowHeight;
      } else {
        // Position the slot in the center of the viewport
        viewport.scrollTop = rowTop - viewportHeight / 2 + rowHeight / 2;
      }
    },
    [isMobile, bottomPanelHeight],
  );

  const openEditor = useCallback(
    (index: number) => {
      const slot = slotMap.get(index);
      setNote(slot?.note ?? "");
      setEditorSlot(index);
    },
    [slotMap],
  );

  const closeEditor = useCallback(() => {
    setEditorSlot(null);
    // Re-focus grid so keyboard shortcuts keep working
    gridRef.current?.focus();
  }, []);

  const handleDragSelectionChange = useCallback((newSelection: Set<number>, anchor: number) => {
    setSelectedSlots(newSelection);
    setAnchorSlot(anchor);
    if (newSelection.size > 1) {
      setEditorSlot(null);
    }
  }, []);

  const handleDragEnd = useCallback(() => {}, []);

  const { isDragging, handlePointerDown, justFinishedDragRef } = useDragSelect(gridRef, {
    focusedSlot,
    onSelectionChange: handleDragSelectionChange,
    onDragEnd: handleDragEnd,
  });

  const handleSlotClick = useCallback(
    (index: number) => {
      if (justFinishedDragRef.current) return;
      setSelectedSlots(new Set());
      setAnchorSlot(index);
      setFocusedSlot(index);
      openEditor(index);
      if (isMobile) pendingScrollSlotRef.current = index;
    },
    [openEditor, justFinishedDragRef, isMobile],
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
    [anchorSlot],
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
      const nextSlot = Math.min(editorSlot + 1, SLOTS_PER_DAY - 1);
      setFocusedSlot(nextSlot);
      openEditor(nextSlot);
      scrollSlotIntoView(nextSlot);
    },
    [editorSlot, date, note, upsertSlot, openEditor, scrollSlotIntoView],
  );

  const handleClearSlot = useCallback(async () => {
    if (editorSlot === null) return;
    await removeSlot({ date, slotIndex: editorSlot });
    if (!isMobile) closeEditor();
  }, [editorSlot, date, removeSlot, closeEditor, isMobile]);

  const handleNoteBlur = useCallback(async () => {
    if (!activeSlot) return;
    if (note !== (activeSlot.note ?? "")) {
      await updateNote({ id: activeSlot._id, note });
    }
  }, [activeSlot, note, updateNote]);

  // Track whether we've done the initial auto-select for this date
  const hasInitializedRef = useRef<string | null>(null);

  // Auto-focus and auto-select earliest unfilled slot when data loads
  useEffect(() => {
    if (!slots || !categories) return;
    if (hasInitializedRef.current === date) return;
    hasInitializedRef.current = date;

    // Find earliest non-categorized slot
    let firstEmpty = 0;
    for (let i = 0; i < SLOTS_PER_DAY; i++) {
      if (!slotMap.has(i)) {
        firstEmpty = i;
        break;
      }
    }

    setFocusedSlot(firstEmpty);
    openEditor(firstEmpty);

    // On mobile, defer scroll until the bottom panel height is known
    if (isMobile) {
      pendingScrollSlotRef.current = firstEmpty;
    }

    // Focus grid after render so keyboard works immediately
    requestAnimationFrame(() => {
      gridRef.current?.focus();
      if (!isMobile) {
        scrollSlotIntoView(firstEmpty);
      }
    });
  }, [slots, categories, date, slotMap, openEditor, scrollSlotIntoView, isMobile]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // If a text input is focused, don't intercept keys
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") {
        if (e.key === "Escape") {
          (e.target as HTMLElement).blur();
          e.preventDefault();
        }
        return;
      }

      // Escape always closes editor or clears selection
      if (e.key === "Escape") {
        e.preventDefault();
        if (editorSlot !== null) {
          closeEditor();
        } else if (selectedSlots.size > 0) {
          setSelectedSlots(new Set());
          setAnchorSlot(null);
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
          } else {
            openEditor(next);
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
          } else {
            openEditor(next);
          }
          break;
        }
        case "Enter":
        case " ": {
          e.preventDefault();
          openEditor(focusedSlot);
          break;
        }
        default: {
          // Don't intercept browser shortcuts (e.g. Cmd+1 to switch tabs)
          if (e.metaKey || e.ctrlKey || e.altKey) break;
          const catIndex = getCategoryIndexFromKey(e.key);
          if (catIndex !== null && categories) {
            e.preventDefault();
            const cat = categories[catIndex];
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
                const nextSlot = Math.min(focusedSlot + 1, SLOTS_PER_DAY - 1);
                setFocusedSlot(nextSlot);
                openEditor(nextSlot);
                scrollSlotIntoView(nextSlot);
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
    ],
  );

  if (!slots || !categories) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground font-mono text-sm">Loading...</p>
      </div>
    );
  }

  const editorContent =
    editorSlot !== null ? (
      <>
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="text-muted-foreground font-mono text-xs">
            {slotIndexToTimeRange(editorSlot)}
          </span>
          <div className="flex items-center gap-1">
            {isMobile && activeCategoryId && (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive h-6 px-1.5 text-xs"
                onClick={handleClearSlot}
              >
                Clear slot
              </Button>
            )}
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={closeEditor}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <div className="space-y-3 p-3">
          <CategoryPicker
            onSelect={handleCategorySelect}
            selectedId={activeCategoryId}
            maxVisibleRows={isMobile ? 5 : undefined}
          />
          <div className="space-y-1.5">
            <Label className="text-muted-foreground font-mono text-xs">Note</Label>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onBlur={handleNoteBlur}
              placeholder="What were you doing?"
              className="h-8 font-mono text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  (e.target as HTMLInputElement).blur();
                }
              }}
            />
          </div>
          {!isMobile && activeCategoryId && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-destructive h-7 w-full text-xs"
              onClick={handleClearSlot}
            >
              <X className="mr-1 h-3 w-3" />
              Clear slot
            </Button>
          )}
        </div>
      </>
    ) : null;

  return (
    <>
      <div className="flex h-full overflow-hidden">
        {/* Grid */}
        <div
          ref={gridRef}
          tabIndex={0}
          role="grid"
          className={cn(
            "flex min-h-0 min-w-0 flex-1 flex-col outline-none",
            isDragging && "cursor-grabbing select-none",
          )}
          onKeyDown={handleKeyDown}
          onPointerDown={handlePointerDown}
        >
          <ScrollArea className="min-h-0 flex-1 [&_[data-slot=scroll-area-viewport]>div]:block!">
            <div style={{ paddingBottom: isMobile && editorSlot !== null ? bottomPanelHeight : 0 }}>
              {Array.from({ length: SLOTS_PER_DAY }, (_, i) => {
                const slot = slotMap.get(i);
                const category = slot ? (categoryMap.get(slot.categoryId) ?? null) : undefined;

                return (
                  <TimeSlotRow
                    key={i}
                    slotIndex={i}
                    slot={slot}
                    category={category}
                    isFocused={focusedSlot === i && editorSlot !== null}
                    isSelected={selectedSlots.has(i)}
                    onClick={() => handleSlotClick(i)}
                    onShiftClick={() => handleShiftClick(i)}
                  />
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Desktop: Editor side panel */}
        {!isMobile && editorContent && (
          <div className="bg-card w-96 shrink-0 border-l">{editorContent}</div>
        )}
      </div>

      {/* Mobile: Editor bottom panel */}
      {isMobile && editorContent && (
        <div
          ref={bottomPanelRef}
          className="bg-card fixed right-0 bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] left-0 z-40 border-t shadow-[0_-2px_10px_rgba(0,0,0,0.1)]"
        >
          {editorContent}
        </div>
      )}

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
