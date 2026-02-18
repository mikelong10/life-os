import { useState, useRef, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CategoryPicker } from "@/components/categories/CategoryPicker";
import { X } from "lucide-react";

export function SlotEditor({
  date,
  slotIndex,
  currentCategoryId,
  currentNote,
  slotId,
  open,
  onOpenChange,
  children,
}: {
  date: string;
  slotIndex: number;
  currentCategoryId?: Id<"categories">;
  currentNote?: string;
  slotId?: Id<"timeSlots">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) {
  const upsertSlot = useMutation(api.timeSlots.upsert);
  const removeSlot = useMutation(api.timeSlots.remove);
  const updateNote = useMutation(api.timeSlots.updateNote);
  const [note, setNote] = useState(currentNote ?? "");
  const noteRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setNote(currentNote ?? "");
  }, [currentNote, open]);

  const handleCategorySelect = async (categoryId: Id<"categories">) => {
    await upsertSlot({ date, slotIndex, categoryId, note: note || undefined });
    onOpenChange(false);
  };

  const handleNoteBlur = async () => {
    if (slotId && note !== (currentNote ?? "")) {
      await updateNote({ id: slotId, note });
    }
  };

  const handleClear = async () => {
    await removeSlot({ date, slotIndex });
    onOpenChange(false);
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        className="w-80 p-3"
        side="right"
        align="start"
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            onOpenChange(false);
          }
        }}
      >
        <div className="space-y-3">
          <CategoryPicker
            onSelect={handleCategorySelect}
            selectedId={currentCategoryId}
          />
          <div className="space-y-1.5">
            <Label className="text-xs font-mono text-muted-foreground">
              Note
            </Label>
            <Input
              ref={noteRef}
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
          {currentCategoryId && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-full text-xs text-muted-foreground hover:text-destructive"
              onClick={handleClear}
            >
              <X className="h-3 w-3 mr-1" />
              Clear slot
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
