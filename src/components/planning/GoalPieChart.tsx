import { useMemo } from "react";
import { PieChart, Pie, Cell } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";
import type { Doc } from "../../../convex/_generated/dataModel";

export function GoalPieChart({
  categories,
  goals,
  chartConfig,
}: {
  categories: Doc<"categories">[];
  goals: Map<string, number>;
  chartConfig: ChartConfig;
}) {
  const data = useMemo(() => {
    return categories
      .map((cat) => ({
        name: cat.name,
        value: goals.get(cat._id) ?? 0,
        fill: cat.color,
        id: cat._id,
      }))
      .filter((d) => d.value > 0);
  }, [categories, goals]);

  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground font-mono">
        Set goals to see distribution
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-64 w-full aspect-auto">
      <PieChart>
        <ChartTooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const entry = payload[0];
            return (
              <div className="rounded-md border bg-popover px-3 py-2 shadow-md">
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 shrink-0 rounded-sm"
                    style={{ backgroundColor: entry.payload.fill }}
                  />
                  <span className="text-sm font-mono text-popover-foreground">
                    {entry.name}
                  </span>
                  <span className="text-sm font-mono font-semibold text-popover-foreground">
                    {entry.value}h
                  </span>
                </div>
              </div>
            );
          }}
        />
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={0}
          outerRadius="85%"
          strokeWidth={2}
          stroke="var(--background)"
        >
          {data.map((entry) => (
            <Cell key={entry.id} fill={entry.fill} />
          ))}
        </Pie>
      </PieChart>
    </ChartContainer>
  );
}
