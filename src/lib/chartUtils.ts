import type { ChartConfig } from "@/components/ui/chart";
import type { Doc } from "../../convex/_generated/dataModel";

export function buildChartConfig(
  categories: Doc<"categories">[]
): ChartConfig {
  const config: ChartConfig = {};
  for (const cat of categories) {
    config[cat._id] = {
      label: cat.name,
      color: cat.color,
    };
  }
  return config;
}
