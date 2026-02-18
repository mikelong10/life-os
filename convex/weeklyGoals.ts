import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getByWeek = query({
  args: { weekStart: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("weeklyGoals")
      .withIndex("by_week", (q) => q.eq("weekStart", args.weekStart))
      .collect();
  },
});

export const upsert = mutation({
  args: {
    weekStart: v.string(),
    categoryId: v.id("categories"),
    goalHours: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("weeklyGoals")
      .withIndex("by_week_category", (q) =>
        q.eq("weekStart", args.weekStart).eq("categoryId", args.categoryId)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { goalHours: args.goalHours });
      return existing._id;
    }

    return await ctx.db.insert("weeklyGoals", {
      weekStart: args.weekStart,
      categoryId: args.categoryId,
      goalHours: args.goalHours,
    });
  },
});

export const seedFromPreviousWeek = mutation({
  args: { weekStart: v.string(), previousWeekStart: v.string() },
  handler: async (ctx, args) => {
    // Check if goals already exist for this week
    const existing = await ctx.db
      .query("weeklyGoals")
      .withIndex("by_week", (q) => q.eq("weekStart", args.weekStart))
      .first();
    if (existing) return;

    // Get all time slots from the previous week (7 days)
    const prevWeekEnd = new Date(args.previousWeekStart);
    prevWeekEnd.setDate(prevWeekEnd.getDate() + 6);
    const endDate = prevWeekEnd.toISOString().split("T")[0];

    const slots = await ctx.db
      .query("timeSlots")
      .withIndex("by_date", (q) =>
        q.gte("date", args.previousWeekStart).lte("date", endDate)
      )
      .collect();

    // Aggregate hours per category
    const hours: Record<string, number> = {};
    for (const slot of slots) {
      const key = slot.categoryId;
      hours[key] = (hours[key] || 0) + 0.5;
    }

    // Create goals seeded from actuals
    for (const [categoryId, goalHours] of Object.entries(hours)) {
      await ctx.db.insert("weeklyGoals", {
        weekStart: args.weekStart,
        categoryId: categoryId as typeof slots[0]["categoryId"],
        goalHours,
      });
    }
  },
});
