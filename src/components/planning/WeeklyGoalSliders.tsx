import { useState, useEffect, useMemo } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id, Doc } from "../../../convex/_generated/dataModel";
import { Slider } from "@/components/ui/slider";

export function WeeklyGoalSliders({
  categories,
  goals,
  actuals,
  weekStart,
  maxHours,
}: {
  categories: Doc<"categories">[];
  goals: { categoryId: string; goalHours: number }[];
  actuals: { categoryId: string; totalHours: number }[];
  weekStart: string;
  maxHours: number;
}) {
  const upsertGoal = useMutation(api.weeklyGoals.upsert);

  const goalMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const g of goals) map.set(g.categoryId, g.goalHours);
    return map;
  }, [goals]);

  const actualMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of actuals) map.set(a.categoryId, a.totalHours);
    return map;
  }, [actuals]);

  const [localGoals, setLocalGoals] = useState<Map<string, number>>(new Map());

  // Initialize local goals from server data
  useEffect(() => {
    const map = new Map<string, number>();
    for (const cat of categories) {
      const goal = goalMap.get(cat._id) ?? actualMap.get(cat._id) ?? 0;
      map.set(cat._id, goal);
    }
    setLocalGoals(map);
  }, [categories, goalMap, actualMap]);

  const totalGoalHours = useMemo(() => {
    let sum = 0;
    for (const v of localGoals.values()) sum += v;
    return sum;
  }, [localGoals]);

  const handleChange = (categoryId: string, value: number) => {
    setLocalGoals((prev) => {
      const next = new Map(prev);
      next.set(categoryId, value);
      return next;
    });
  };

  const handleCommit = (categoryId: string, value: number) => {
    upsertGoal({
      weekStart,
      categoryId: categoryId as Id<"categories">,
      goalHours: value,
    });
  };

  return (
    <div className="space-y-4">
      {categories.map((cat) => {
        const actual = actualMap.get(cat._id) ?? 0;
        const goal = localGoals.get(cat._id) ?? 0;

        return (
          <div key={cat._id} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-sm"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="text-sm font-mono">{cat.name}</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground">
                <span>Last: {actual.toFixed(1)}h</span>
                <span className="font-medium text-foreground">
                  Goal: {goal.toFixed(1)}h{" "}
                  <span className="font-normal text-muted-foreground">
                    ({(goal / 7).toFixed(1)}h/d)
                  </span>
                </span>
              </div>
            </div>
            <Slider
              value={[goal]}
              min={0}
              max={maxHours}
              step={0.5}
              onValueChange={([v]) => handleChange(cat._id, v)}
              onValueCommit={([v]) => handleCommit(cat._id, v)}
              className="w-full"
            />
          </div>
        );
      })}

      <div className="flex items-center justify-between border-t pt-3">
        <span className="text-sm font-mono font-medium">Total</span>
        <span
          className={`text-sm font-mono font-medium ${
            totalGoalHours > maxHours ? "text-destructive" : ""
          }`}
        >
          {totalGoalHours.toFixed(1)}h / {maxHours}h{" "}
          <span className="font-normal text-muted-foreground">
            ({(totalGoalHours / 7).toFixed(1)}h/d)
          </span>
        </span>
      </div>
    </div>
  );
}
