import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type DateRangeView = "day" | "week" | "month" | "year";

export function DateRangeFilter({
  view,
  onViewChange,
  label,
  onPrev,
  onNext,
}: {
  view: DateRangeView;
  onViewChange: (view: DateRangeView) => void;
  label: string;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <Tabs
        value={view}
        onValueChange={(v) => onViewChange(v as DateRangeView)}
      >
        <TabsList className="h-8">
          <TabsTrigger value="day" className="text-xs font-mono px-2.5">
            Day
          </TabsTrigger>
          <TabsTrigger value="week" className="text-xs font-mono px-2.5">
            Week
          </TabsTrigger>
          <TabsTrigger value="month" className="text-xs font-mono px-2.5">
            Month
          </TabsTrigger>
          <TabsTrigger value="year" className="text-xs font-mono px-2.5">
            Year
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onPrev}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="min-w-32 text-center text-sm font-mono">{label}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onNext}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
