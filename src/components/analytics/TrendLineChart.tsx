import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { Doc } from "../../../convex/_generated/dataModel";

export function TrendLineChart({
  slots,
  categories,
  chartConfig,
  groupBy,
}: {
  slots: Doc<"timeSlots">[];
  categories: Doc<"categories">[];
  chartConfig: ChartConfig;
  groupBy: "day" | "week" | "month";
}) {
  const data = useMemo(() => {
    // Group slots by date, then by category
    const grouped = new Map<string, Map<string, number>>();

    for (const slot of slots) {
      let key = slot.date;
      if (groupBy === "week") {
        const d = new Date(slot.date + "T00:00:00");
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        d.setDate(diff);
        key = d.toISOString().split("T")[0];
      } else if (groupBy === "month") {
        key = slot.date.slice(0, 7);
      }

      if (!grouped.has(key)) grouped.set(key, new Map());
      const catMap = grouped.get(key)!;
      const catId = slot.categoryId as string;
      catMap.set(catId, (catMap.get(catId) || 0) + 0.5);
    }

    // Convert to chart data array
    const entries = Array.from(grouped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, catMap]) => {
        const entry: Record<string, string | number> = { date };
        for (const cat of categories) {
          entry[cat._id] = catMap.get(cat._id) || 0;
        }
        return entry;
      });

    return entries;
  }, [slots, categories, groupBy]);

  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground font-mono">
        No data for this period
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-72 w-full">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fontFamily: "Geist Mono" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fontFamily: "Geist Mono" }}
          tickLine={false}
          axisLine={false}
          label={{
            value: "hours",
            angle: -90,
            position: "insideLeft",
            style: { fontSize: 11, fontFamily: "Geist Mono" },
          }}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent formatter={(value) => `${value}h`} />
          }
        />
        {categories.map((cat) => (
          <Line
            key={cat._id}
            type="monotone"
            dataKey={cat._id}
            name={cat.name}
            stroke={cat.color}
            strokeWidth={2}
            dot={false}
          />
        ))}
      </LineChart>
    </ChartContainer>
  );
}
