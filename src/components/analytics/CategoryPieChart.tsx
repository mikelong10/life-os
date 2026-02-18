import { useMemo } from "react";
import { PieChart, Pie, Cell } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
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
          content={
            <ChartTooltipContent
              formatter={(value) => `${value}h`}
            />
          }
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
