import { useCallback, useEffect, useRef, useState } from "react";

function preventTouchScroll(e: TouchEvent) {
  e.preventDefault();
}

function getItemIndexFromPoint(x: number, y: number): number | null {
  const el = document.elementFromPoint(x, y);
  const row = el?.closest("[data-sortable-index]") as HTMLElement | null;
  if (!row) return null;
  const index = parseInt(row.getAttribute("data-sortable-index")!, 10);
  return Number.isFinite(index) ? index : null;
}

interface UseSortableOptions {
  itemCount: number;
  onReorder: (fromIndex: number, toIndex: number) => void;
  getLabel?: (index: number) => string | null;
}

export function useSortable({ itemCount, onReorder, getLabel }: UseSortableOptions) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const dragIndexRef = useRef<number | null>(null);
  const overIndexRef = useRef<number | null>(null);
  const onReorderRef = useRef(onReorder);
  const getLabelRef = useRef(getLabel);
  const cloneRef = useRef<HTMLElement | null>(null);
  const offsetRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    onReorderRef.current = onReorder;
  }, [onReorder]);
  useEffect(() => {
    getLabelRef.current = getLabel;
  }, [getLabel]);

  const removeClone = useCallback(() => {
    if (cloneRef.current) {
      cloneRef.current.remove();
      cloneRef.current = null;
    }
  }, []);

  const updateCloneLabel = useCallback((index: number) => {
    if (!cloneRef.current || !getLabelRef.current) return;
    const kbd = cloneRef.current.querySelector("kbd");
    if (!kbd) return;
    const label = getLabelRef.current(index);
    if (label !== null) {
      kbd.textContent = label;
    }
  }, []);

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!isDraggingRef.current) return;

      // Move the drag preview clone
      if (cloneRef.current) {
        cloneRef.current.style.left = `${e.clientX - offsetRef.current.x}px`;
        cloneRef.current.style.top = `${e.clientY - offsetRef.current.y}px`;
      }

      // Hide the clone briefly to hit-test the element underneath
      if (cloneRef.current) cloneRef.current.style.pointerEvents = "none";
      const index = getItemIndexFromPoint(e.clientX, e.clientY);
      if (cloneRef.current) cloneRef.current.style.pointerEvents = "";

      if (index !== null) {
        const changed = index !== overIndexRef.current;
        overIndexRef.current = index;
        setOverIndex(index);
        if (changed) {
          updateCloneLabel(index);
        }
      }
    },
    [updateCloneLabel]
  );

  const handlePointerUp = useCallback(async () => {
    if (!isDraggingRef.current) return;

    const from = dragIndexRef.current;
    const to = overIndexRef.current;

    // Stop the drag interaction and remove the clone immediately,
    // but keep dragIndex/overIndex state so the reordered preview persists.
    isDraggingRef.current = false;
    setIsDragging(false);
    removeClone();
    document.body.style.userSelect = "";
    document.removeEventListener("touchmove", preventTouchScroll);

    if (from !== null && to !== null && from !== to) {
      await onReorderRef.current(from, to);
    }

    // Clear display state only after the mutation has settled,
    // so the list doesn't flash back to the old order.
    dragIndexRef.current = null;
    overIndexRef.current = null;
    setDragIndex(null);
    setOverIndex(null);
  }, [removeClone]);

  useEffect(() => {
    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);
    document.addEventListener("pointercancel", handlePointerUp);

    return () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
      document.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  const handlePointerDown = useCallback(
    (index: number, e: React.PointerEvent) => {
      if (e.button !== 0) return;
      if (index < 0 || index >= itemCount) return;

      // Prevent text selection during drag
      e.preventDefault();
      document.body.style.userSelect = "none";

      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);

      isDraggingRef.current = true;
      setIsDragging(true);
      dragIndexRef.current = index;
      setDragIndex(index);
      overIndexRef.current = index;
      setOverIndex(index);

      // Create a visual clone of the dragged row
      const row = (e.target as HTMLElement).closest(
        "[data-sortable-index]"
      ) as HTMLElement | null;
      if (row) {
        const rect = row.getBoundingClientRect();
        offsetRef.current = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        };
        const clone = row.cloneNode(true) as HTMLElement;
        clone.style.position = "fixed";
        clone.style.left = `${rect.left}px`;
        clone.style.top = `${rect.top}px`;
        clone.style.width = `${rect.width}px`;
        clone.style.zIndex = "9999";
        clone.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
        clone.style.pointerEvents = "none";
        document.body.appendChild(clone);
        cloneRef.current = clone;
      }

      // Prevent page scrolling on touch devices during drag
      if (e.pointerType === "touch") {
        document.addEventListener("touchmove", preventTouchScroll, {
          passive: false,
        });
      }
    },
    [itemCount]
  );

  return { dragIndex, overIndex, isDragging, handlePointerDown };
}
