import { format, parse } from "date-fns";
import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";

import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();

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
      <div className="text-muted-foreground flex h-64 items-center justify-center font-mono text-sm">
        No data for this period
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-72 w-full">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: isMobile ? 10 : 11, fontFamily: "Geist Mono" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value: string) => {
            if (!isMobile) return value;
            try {
              if (value.length === 7) return format(parse(value, "yyyy-MM", new Date()), "MMM");
              return format(parse(value, "yyyy-MM-dd", new Date()), "M/d");
            } catch {
              return value;
            }
          }}
        />
        <YAxis
          tick={{ fontSize: isMobile ? 10 : 11, fontFamily: "Geist Mono" }}
          tickLine={false}
          axisLine={false}
          width={isMobile ? 30 : 60}
          label={
            isMobile
              ? undefined
              : {
                  value: "hours",
                  angle: -90,
                  position: "insideLeft",
                  style: { fontSize: 11, fontFamily: "Geist Mono" },
                }
          }
        />
        <ChartTooltip
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            const nonZero = payload.filter((p) => p.value !== 0);
            if (!nonZero.length) return null;
            const catMap = new Map(categories.map((c) => [c._id, c]));
            let formattedDate = String(label);
            try {
              if (groupBy === "month") {
                formattedDate = format(parse(String(label), "yyyy-MM", new Date()), "MMM yyyy");
              } else {
                formattedDate = format(
                  parse(String(label), "yyyy-MM-dd", new Date()),
                  "MMM d, yyyy",
                );
              }
            } catch {
              /* use raw label as fallback */
            }
            return (
              <div className="bg-popover rounded-md border px-3 py-2 shadow-md">
                <div className="text-popover-foreground mb-1 font-mono text-sm font-semibold">
                  {formattedDate}
                </div>
                <div className="flex flex-col gap-1">
                  {nonZero.map((entry) => {
                    const cat = catMap.get(entry.dataKey as Doc<"categories">["_id"]);
                    return (
                      <div key={entry.dataKey} className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 shrink-0 rounded-sm"
                          style={{ backgroundColor: cat?.color ?? (entry.color as string) }}
                        />
                        <span className="text-popover-foreground font-mono text-sm">
                          {cat?.name ?? entry.name}
                        </span>
                        <span className="text-popover-foreground font-mono text-sm font-semibold">
                          {entry.value}h
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }}
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
