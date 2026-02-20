import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";
import {
  DateRangeFilter,
  type DateRangeView,
} from "@/components/analytics/DateRangeFilter";
import { CategoryPieChart } from "@/components/analytics/CategoryPieChart";
import { Card } from "@/components/ui/card";
import { TrendLineChart } from "@/components/analytics/TrendLineChart";
import { buildChartConfig } from "@/lib/chartUtils";
import {
  todayString,
  getWeekStart,
  getWeekEnd,
  fromDateString,
  toDateString,
} from "@/lib/dateUtils";
import {
  format,
  addDays,
  subDays,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  addYears,
  subYears,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from "date-fns";

export const Route = createFileRoute("/analytics")({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const [view, setView] = useState<DateRangeView>("week");
  const [anchor, setAnchor] = useState(todayString);

  const { startDate, endDate, label } = useMemo(() => {
    const d = fromDateString(anchor);
    switch (view) {
      case "day":
        return {
          startDate: anchor,
          endDate: anchor,
          label: format(d, "MMM d, yyyy"),
        };
      case "week": {
        const ws = getWeekStart(anchor);
        const we = getWeekEnd(anchor);
        return {
          startDate: ws,
          endDate: we,
          label: `${format(fromDateString(ws), "MMM d")} – ${format(fromDateString(we), "MMM d, yyyy")}`,
        };
      }
      case "month":
        return {
          startDate: toDateString(startOfMonth(d)),
          endDate: toDateString(endOfMonth(d)),
          label: format(d, "MMMM yyyy"),
        };
      case "year":
        return {
          startDate: toDateString(startOfYear(d)),
          endDate: toDateString(endOfYear(d)),
          label: format(d, "yyyy"),
        };
    }
  }, [view, anchor]);

  const handlePrev = () => {
    const d = fromDateString(anchor);
    switch (view) {
      case "day":
        setAnchor(toDateString(subDays(d, 1)));
        break;
      case "week":
        setAnchor(toDateString(subWeeks(d, 1)));
        break;
      case "month":
        setAnchor(toDateString(subMonths(d, 1)));
        break;
      case "year":
        setAnchor(toDateString(subYears(d, 1)));
        break;
    }
  };

  const handleNext = () => {
    const d = fromDateString(anchor);
    switch (view) {
      case "day":
        setAnchor(toDateString(addDays(d, 1)));
        break;
      case "week":
        setAnchor(toDateString(addWeeks(d, 1)));
        break;
      case "month":
        setAnchor(toDateString(addMonths(d, 1)));
        break;
      case "year":
        setAnchor(toDateString(addYears(d, 1)));
        break;
    }
  };

  const categories = useQuery(api.categories.list);
  const summary = useQuery(api.timeSlots.getCategorySummary, {
    startDate,
    endDate,
  });
  const slots = useQuery(api.timeSlots.getByDateRange, {
    startDate,
    endDate,
  });

  const chartConfig = useMemo(
    () => (categories ? buildChartConfig(categories as Doc<"categories">[]) : {}),
    [categories]
  );

  const trendGroupBy = view === "year" ? "month" : view === "month" ? "week" : "day";

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      <div>
        <h1 className="text-xl font-mono font-semibold text-foreground">
          Analytics
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review how you're spending your time.
        </p>
      </div>

      <DateRangeFilter
        view={view}
        onViewChange={setView}
        label={label}
        onPrev={handlePrev}
        onNext={handleNext}
      />

      {!categories || !summary || !slots ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-muted-foreground font-mono">Loading...</p>
        </div>
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,_320px)_1fr]">
            <Card className="p-4 gap-4 overflow-hidden min-w-0">
              <h3 className="text-sm font-mono font-medium text-muted-foreground">
                Time Breakdown
              </h3>
              <CategoryPieChart
                summary={summary as { categoryId: string; totalHours: number }[]}
                categories={categories as Doc<"categories">[]}
                chartConfig={chartConfig}
              />
            </Card>

            <Card className="p-4 gap-4 overflow-hidden min-w-0">
              <h3 className="text-sm font-mono font-medium text-muted-foreground">
                Trends
              </h3>
              <TrendLineChart
                slots={slots as Doc<"timeSlots">[]}
                categories={categories as Doc<"categories">[]}
                chartConfig={chartConfig}
                groupBy={trendGroupBy}
              />
            </Card>
          </div>

        </>
      )}
    </div>
  );
}
