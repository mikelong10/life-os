import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type PlanningPeriod = "week" | "month" | "year";

export function PeriodSelector({
  period,
  onPeriodChange,
  label,
  onPrev,
  onNext,
}: {
  period: PlanningPeriod;
  onPeriodChange: (period: PlanningPeriod) => void;
  label: string;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex items-center gap-4">
      <Tabs
        value={period}
        onValueChange={(v) => onPeriodChange(v as PlanningPeriod)}
      >
        <TabsList className="h-8">
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
        <span className="min-w-40 text-center text-sm font-mono">{label}</span>
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
