import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "convex/react";
import { format, addWeeks, subWeeks, addMonths, subMonths, addYears, subYears } from "date-fns";
import { useState, useMemo, useEffect } from "react";

import { GoalPieChart } from "@/components/planning/GoalPieChart";
import { PeriodSelector, type PlanningPeriod } from "@/components/planning/PeriodSelector";
import { WeeklyGoalSliders } from "@/components/planning/WeeklyGoalSliders";
import { Card } from "@/components/ui/card";
import { buildChartConfig } from "@/lib/chartUtils";
import {
  todayString,
  getWeekStart,
  getWeekEnd,
  fromDateString,
  toDateString,
} from "@/lib/dateUtils";

import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";

export const Route = createFileRoute("/planning")({
  component: PlanningPage,
});

function PlanningPage() {
  const [period, setPeriod] = useState<PlanningPeriod>("week");
  const [anchor, setAnchor] = useState(todayString);

  const weekStart = getWeekStart(anchor);

  // Calculate previous period for actuals
  const prevWeekStart = toDateString(subWeeks(fromDateString(weekStart), 1));

  const { label, maxHours } = useMemo(() => {
    const d = fromDateString(anchor);
    switch (period) {
      case "week": {
        const ws = fromDateString(weekStart);
        const we = fromDateString(getWeekEnd(anchor));
        return {
          label: `${format(ws, "MMM d")} – ${format(we, "MMM d, yyyy")}`,
          maxHours: 168,
        };
      }
      case "month":
        return {
          label: format(d, "MMMM yyyy"),
          maxHours: 168, // Show weekly average targets
        };
      case "year":
        return {
          label: format(d, "yyyy"),
          maxHours: 168, // Show weekly average targets
        };
    }
  }, [period, anchor, weekStart]);

  const handlePrev = () => {
    const d = fromDateString(anchor);
    switch (period) {
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
    switch (period) {
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
  const goals = useQuery(api.weeklyGoals.getByWeek, { weekStart });
  const prevActuals = useQuery(api.timeSlots.getCategorySummary, {
    startDate: prevWeekStart,
    endDate: toDateString(addWeeks(fromDateString(prevWeekStart), 1)),
  });

  // Auto-seed goals from previous week if none exist
  const seedGoals = useMutation(api.weeklyGoals.seedFromPreviousWeek);
  useEffect(() => {
    if (goals && goals.length === 0 && prevActuals && prevActuals.length > 0) {
      seedGoals({ weekStart, previousWeekStart: prevWeekStart });
    }
  }, [goals, prevActuals, weekStart, prevWeekStart, seedGoals]);

  const chartConfig = useMemo(
    () => (categories ? buildChartConfig(categories as Doc<"categories">[]) : {}),
    [categories],
  );

  const goalMap = useMemo(() => {
    const map = new Map<string, number>();
    if (goals) {
      for (const g of goals as { categoryId: string; goalHours: number }[]) {
        map.set(g.categoryId, g.goalHours);
      }
    }
    return map;
  }, [goals]);

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      <div>
        <h1 className="text-foreground font-mono text-xl font-semibold">Planning</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Set goals for how you want to spend your time.
        </p>
      </div>

      <PeriodSelector
        period={period}
        onPeriodChange={setPeriod}
        label={label}
        onPrev={handlePrev}
        onNext={handleNext}
      />

      {!categories || !goals || !prevActuals ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground font-mono text-sm">Loading...</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="min-w-0 gap-4 overflow-hidden p-4 lg:col-span-2">
            <h3 className="text-muted-foreground font-mono text-sm font-medium">
              Weekly Hour Goals
            </h3>
            <WeeklyGoalSliders
              categories={categories as Doc<"categories">[]}
              goals={goals as { categoryId: string; goalHours: number }[]}
              actuals={prevActuals as { categoryId: string; totalHours: number }[]}
              weekStart={weekStart}
              maxHours={maxHours}
            />
          </Card>

          <Card className="min-w-0 gap-4 overflow-hidden p-4">
            <h3 className="text-muted-foreground font-mono text-sm font-medium">
              Planned Distribution
            </h3>
            <GoalPieChart
              categories={categories as Doc<"categories">[]}
              goals={goalMap}
              chartConfig={chartConfig}
            />
          </Card>
        </div>
      )}
    </div>
  );
}
