import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatDisplayDate, isDateToday } from "@/lib/dateUtils";

export function DayNavigator({
  date,
  onPrev,
  onNext,
  onToday,
}: {
  date: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}) {
  const dateObj = new Date(date + "T00:00:00");
  const today = isDateToday(date);

  return (
    <div className="flex items-center gap-3">
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onPrev}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div className="flex items-center gap-2">
        <h2 className="whitespace-nowrap text-sm font-mono font-medium">
          {formatDisplayDate(dateObj)}
        </h2>
        {!today && (
          <Button
            variant="outline"
            size="sm"
            className="h-6 px-2 text-xs font-mono"
            onClick={onToday}
          >
            Today
          </Button>
        )}
      </div>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onNext}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
