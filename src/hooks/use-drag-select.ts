import { useCallback, useEffect, useRef, useState } from "react";

interface UseDragSelectOptions {
  focusedSlot: number;
  onSelectionChange: (selectedSlots: Set<number>, anchorSlot: number) => void;
  onDragEnd: () => void;
}

function getSlotIndexFromPoint(clientX: number, clientY: number): number | null {
  const el = document.elementFromPoint(clientX, clientY);
  const row = el?.closest("[data-slot-index]") as HTMLElement | null;
  if (!row) return null;
  const index = parseInt(row.getAttribute("data-slot-index")!, 10);
  return Number.isFinite(index) ? index : null;
}

function getViewport(gridEl: HTMLElement): HTMLElement | null {
  return gridEl.querySelector('[data-slot="scroll-area-viewport"]');
}

function buildRange(a: number, b: number): Set<number> {
  const start = Math.min(a, b);
  const end = Math.max(a, b);
  const set = new Set<number>();
  for (let i = start; i <= end; i++) set.add(i);
  return set;
}

function preventTouchScroll(e: TouchEvent) {
  e.preventDefault();
}

const AUTO_SCROLL_THRESHOLD = 40;
const AUTO_SCROLL_SPEED = 4;

export function useDragSelect(
  gridRef: React.RefObject<HTMLDivElement | null>,
  options: UseDragSelectOptions,
) {
  const { focusedSlot, onSelectionChange, onDragEnd } = options;

  const isDraggingRef = useRef(false);
  const dragAnchorRef = useRef<number | null>(null);
  const currentSlotRef = useRef<number | null>(null);
  const autoScrollRAF = useRef<number | null>(null);
  const pointerYRef = useRef<number>(0);
  const justFinishedDragRef = useRef(false);
  const onSelectionChangeRef = useRef(onSelectionChange);
  const onDragEndRef = useRef(onDragEnd);

  const [isDragging, setIsDragging] = useState(false);

  // Keep callback refs fresh without re-attaching listeners
  useEffect(() => {
    onSelectionChangeRef.current = onSelectionChange;
  }, [onSelectionChange]);
  useEffect(() => {
    onDragEndRef.current = onDragEnd;
  }, [onDragEnd]);

  const stopAutoScroll = useCallback(() => {
    if (autoScrollRAF.current !== null) {
      cancelAnimationFrame(autoScrollRAF.current);
      autoScrollRAF.current = null;
    }
  }, []);

  const startAutoScroll = useCallback(() => {
    function tick() {
      if (!isDraggingRef.current || !gridRef.current) return;

      const viewport = getViewport(gridRef.current);
      if (!viewport) return;

      const rect = viewport.getBoundingClientRect();
      const y = pointerYRef.current;

      if (y < rect.top + AUTO_SCROLL_THRESHOLD) {
        const intensity = 1 - (y - rect.top) / AUTO_SCROLL_THRESHOLD;
        viewport.scrollTop -= AUTO_SCROLL_SPEED * Math.max(intensity, 0.2);
      } else if (y > rect.bottom - AUTO_SCROLL_THRESHOLD) {
        const intensity = 1 - (rect.bottom - y) / AUTO_SCROLL_THRESHOLD;
        viewport.scrollTop += AUTO_SCROLL_SPEED * Math.max(intensity, 0.2);
      }

      // Re-hit-test after scrolling
      const slotIndex = getSlotIndexFromPoint(
        rect.left + rect.width / 2,
        Math.max(rect.top, Math.min(y, rect.bottom)),
      );
      if (slotIndex !== null && slotIndex !== currentSlotRef.current) {
        currentSlotRef.current = slotIndex;
        const anchor = dragAnchorRef.current!;
        onSelectionChangeRef.current(buildRange(anchor, slotIndex), anchor);
      }

      autoScrollRAF.current = requestAnimationFrame(tick);
    }
    autoScrollRAF.current = requestAnimationFrame(tick);
  }, [gridRef]);

  const cleanup = useCallback(() => {
    isDraggingRef.current = false;
    setIsDragging(false);
    stopAutoScroll();

    if (gridRef.current) {
      const viewport = getViewport(gridRef.current);
      if (viewport) {
        viewport.removeEventListener("touchmove", preventTouchScroll);
      }
    }
  }, [gridRef, stopAutoScroll]);

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!isDraggingRef.current) return;

    pointerYRef.current = e.clientY;

    const slotIndex = getSlotIndexFromPoint(e.clientX, e.clientY);
    if (slotIndex === null) return;
    if (slotIndex === currentSlotRef.current) return;

    currentSlotRef.current = slotIndex;
    const anchor = dragAnchorRef.current!;
    onSelectionChangeRef.current(buildRange(anchor, slotIndex), anchor);
  }, []);

  const handlePointerUp = useCallback(() => {
    if (!isDraggingRef.current) return;

    if (currentSlotRef.current !== dragAnchorRef.current) {
      justFinishedDragRef.current = true;
      requestAnimationFrame(() => {
        justFinishedDragRef.current = false;
      });
    }

    cleanup();
    onDragEndRef.current();
  }, [cleanup]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;

      const slotIndex = getSlotIndexFromPoint(e.clientX, e.clientY);
      if (slotIndex === null) return;

      // Only start drag from the focused slot
      if (slotIndex !== focusedSlot) return;

      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);

      isDraggingRef.current = true;
      dragAnchorRef.current = slotIndex;
      currentSlotRef.current = slotIndex;
      pointerYRef.current = e.clientY;
      setIsDragging(true);

      onSelectionChangeRef.current(new Set([slotIndex]), slotIndex);

      // Prevent touch scrolling during drag
      if (e.pointerType === "touch" && gridRef.current) {
        const viewport = getViewport(gridRef.current);
        if (viewport) {
          viewport.addEventListener("touchmove", preventTouchScroll, {
            passive: false,
          });
        }
      }

      startAutoScroll();
    },
    [focusedSlot, gridRef, startAutoScroll],
  );

  // Escape cancels drag
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isDraggingRef.current) {
        cleanup();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [cleanup]);

  // Document-level move/up/cancel listeners
  useEffect(() => {
    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);
    document.addEventListener("pointercancel", handlePointerUp);

    return () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
      document.removeEventListener("pointercancel", handlePointerUp);
      stopAutoScroll();
    };
  }, [handlePointerMove, handlePointerUp, stopAutoScroll]);

  return { isDragging, handlePointerDown, justFinishedDragRef };
}
