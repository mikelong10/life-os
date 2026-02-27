import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
      <Tabs value={view} onValueChange={(v) => onViewChange(v as DateRangeView)}>
        <TabsList className="h-8">
          <TabsTrigger value="day" className="px-2.5 font-mono text-xs">
            Day
          </TabsTrigger>
          <TabsTrigger value="week" className="px-2.5 font-mono text-xs">
            Week
          </TabsTrigger>
          <TabsTrigger value="month" className="px-2.5 font-mono text-xs">
            Month
          </TabsTrigger>
          <TabsTrigger value="year" className="px-2.5 font-mono text-xs">
            Year
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onPrev}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="min-w-32 text-center font-mono text-sm">{label}</span>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onNext}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
