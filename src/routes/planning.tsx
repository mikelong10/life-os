import { useState, useMemo, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";
import {
  PeriodSelector,
  type PlanningPeriod,
} from "@/components/planning/PeriodSelector";
import { WeeklyGoalSliders } from "@/components/planning/WeeklyGoalSliders";
import { GoalPieChart } from "@/components/planning/GoalPieChart";
import { buildChartConfig } from "@/lib/chartUtils";
import { todayString, getWeekStart, fromDateString, toDateString } from "@/lib/dateUtils";
import {
  format,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  addYears,
  subYears,
} from "date-fns";

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
      case "week":
        return {
          label: `Week of ${format(fromDateString(weekStart), "MMM d, yyyy")}`,
          maxHours: 168,
        };
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
    () =>
      categories ? buildChartConfig(categories as Doc<"categories">[]) : {},
    [categories]
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
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-xl font-mono font-semibold text-foreground">
          Planning
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
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
          <p className="text-sm text-muted-foreground font-mono">Loading...</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-lg border bg-card p-4">
            <h3 className="mb-4 text-sm font-mono font-medium text-muted-foreground">
              Weekly Hour Goals
            </h3>
            <WeeklyGoalSliders
              categories={categories as Doc<"categories">[]}
              goals={goals as { categoryId: string; goalHours: number }[]}
              actuals={
                prevActuals as { categoryId: string; totalHours: number }[]
              }
              weekStart={weekStart}
              maxHours={maxHours}
            />
          </div>

          <div className="rounded-lg border bg-card p-4">
            <h3 className="mb-4 text-sm font-mono font-medium text-muted-foreground">
              Planned Distribution
            </h3>
            <GoalPieChart
              categories={categories as Doc<"categories">[]}
              goals={goalMap}
              chartConfig={chartConfig}
            />
          </div>
        </div>
      )}
    </div>
  );
}
