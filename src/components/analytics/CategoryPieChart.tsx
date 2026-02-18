import { useMemo } from "react";
import { PieChart, Pie, Cell } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";
import type { Doc } from "../../../convex/_generated/dataModel";

export function CategoryPieChart({
  summary,
  categories,
  chartConfig,
}: {
  summary: { categoryId: string; totalHours: number }[];
  categories: Doc<"categories">[];
  chartConfig: ChartConfig;
}) {
  const data = useMemo(() => {
    const catMap = new Map(categories.map((c) => [c._id, c]));
    return summary
      .map((s) => {
        const cat = catMap.get(s.categoryId as Doc<"categories">["_id"]);
        if (!cat) return null;
        return {
          name: cat.name,
          value: s.totalHours,
          fill: cat.color,
          id: cat._id,
        };
      })
      .filter(Boolean);
  }, [summary, categories]);

  const totalHours = useMemo(
    () => data.reduce((sum, d) => sum + (d?.value ?? 0), 0),
    [data]
  );

  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground font-mono">
        No data for this period
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-64 w-full">
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
          innerRadius={60}
          outerRadius={100}
          strokeWidth={2}
          stroke="var(--background)"
        >
          {data.map((entry) => (
            <Cell key={entry?.id} fill={entry?.fill} />
          ))}
        </Pie>
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-foreground text-lg font-mono font-semibold"
        >
          {totalHours.toFixed(1)}h
        </text>
      </PieChart>
    </ChartContainer>
  );
}
