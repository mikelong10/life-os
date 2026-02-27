import { v } from "convex/values";

import { query, mutation, type QueryCtx, type MutationCtx } from "./_generated/server";

async function getAuthUserId(ctx: QueryCtx | MutationCtx): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");
  return identity.tokenIdentifier;
}

export const getByWeek = query({
  args: { weekStart: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    return await ctx.db
      .query("weeklyGoals")
      .withIndex("by_user_week", (q) => q.eq("userId", userId).eq("weekStart", args.weekStart))
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
    const userId = await getAuthUserId(ctx);
    const existing = await ctx.db
      .query("weeklyGoals")
      .withIndex("by_user_week_category", (q) =>
        q.eq("userId", userId).eq("weekStart", args.weekStart).eq("categoryId", args.categoryId),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { goalHours: args.goalHours });
      return existing._id;
    }

    return await ctx.db.insert("weeklyGoals", {
      userId,
      weekStart: args.weekStart,
      categoryId: args.categoryId,
      goalHours: args.goalHours,
    });
  },
});

export const seedFromPreviousWeek = mutation({
  args: { weekStart: v.string(), previousWeekStart: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    const existing = await ctx.db
      .query("weeklyGoals")
      .withIndex("by_user_week", (q) => q.eq("userId", userId).eq("weekStart", args.weekStart))
      .first();
    if (existing) return;

    const prevWeekEnd = new Date(args.previousWeekStart);
    prevWeekEnd.setDate(prevWeekEnd.getDate() + 6);
    const endDate = prevWeekEnd.toISOString().split("T")[0];

    const slots = await ctx.db
      .query("timeSlots")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", userId).gte("date", args.previousWeekStart).lte("date", endDate),
      )
      .collect();

    const hours: Record<string, number> = {};
    for (const slot of slots) {
      const key = slot.categoryId;
      hours[key] = (hours[key] || 0) + 0.5;
    }

    for (const [categoryId, goalHours] of Object.entries(hours)) {
      await ctx.db.insert("weeklyGoals", {
        userId,
        weekStart: args.weekStart,
        categoryId: categoryId as (typeof slots)[0]["categoryId"],
        goalHours,
      });
    }
  },
});
