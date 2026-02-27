import { v } from "convex/values";

import { query, mutation, type QueryCtx, type MutationCtx } from "./_generated/server";

async function getAuthUserId(ctx: QueryCtx | MutationCtx): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");
  return identity.tokenIdentifier;
}

export const getByDate = query({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    return await ctx.db
      .query("timeSlots")
      .withIndex("by_user_date", (q) => q.eq("userId", userId).eq("date", args.date))
      .collect();
  },
});

export const getByDateRange = query({
  args: { startDate: v.string(), endDate: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    return await ctx.db
      .query("timeSlots")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", userId).gte("date", args.startDate).lte("date", args.endDate),
      )
      .collect();
  },
});

export const getCategorySummary = query({
  args: { startDate: v.string(), endDate: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const slots = await ctx.db
      .query("timeSlots")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", userId).gte("date", args.startDate).lte("date", args.endDate),
      )
      .collect();

    const summary: Record<string, number> = {};
    for (const slot of slots) {
      const key = slot.categoryId;
      summary[key] = (summary[key] || 0) + 1;
    }

    return Object.entries(summary).map(([categoryId, totalSlots]) => ({
      categoryId,
      totalSlots,
      totalHours: totalSlots * 0.5,
    }));
  },
});

export const upsert = mutation({
  args: {
    date: v.string(),
    slotIndex: v.number(),
    categoryId: v.id("categories"),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const existing = await ctx.db
      .query("timeSlots")
      .withIndex("by_user_date_slot", (q) =>
        q.eq("userId", userId).eq("date", args.date).eq("slotIndex", args.slotIndex),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        categoryId: args.categoryId,
        note: args.note,
      });
      return existing._id;
    }

    return await ctx.db.insert("timeSlots", {
      userId,
      date: args.date,
      slotIndex: args.slotIndex,
      categoryId: args.categoryId,
      note: args.note,
    });
  },
});

export const bulkAssign = mutation({
  args: {
    date: v.string(),
    slotIndexes: v.array(v.number()),
    categoryId: v.id("categories"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    for (const slotIndex of args.slotIndexes) {
      const existing = await ctx.db
        .query("timeSlots")
        .withIndex("by_user_date_slot", (q) =>
          q.eq("userId", userId).eq("date", args.date).eq("slotIndex", slotIndex),
        )
        .unique();

      if (existing) {
        await ctx.db.patch(existing._id, { categoryId: args.categoryId });
      } else {
        await ctx.db.insert("timeSlots", {
          userId,
          date: args.date,
          slotIndex,
          categoryId: args.categoryId,
        });
      }
    }
  },
});

export const bulkRemove = mutation({
  args: {
    date: v.string(),
    slotIndexes: v.array(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    for (const slotIndex of args.slotIndexes) {
      const existing = await ctx.db
        .query("timeSlots")
        .withIndex("by_user_date_slot", (q) =>
          q.eq("userId", userId).eq("date", args.date).eq("slotIndex", slotIndex),
        )
        .unique();

      if (existing) {
        await ctx.db.delete(existing._id);
      }
    }
  },
});

export const remove = mutation({
  args: { date: v.string(), slotIndex: v.number() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const existing = await ctx.db
      .query("timeSlots")
      .withIndex("by_user_date_slot", (q) =>
        q.eq("userId", userId).eq("date", args.date).eq("slotIndex", args.slotIndex),
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

export const updateNote = mutation({
  args: { id: v.id("timeSlots"), note: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const slot = await ctx.db.get(args.id);
    if (!slot || slot.userId !== userId) {
      throw new Error("Not authorized");
    }
    await ctx.db.patch(args.id, { note: args.note });
  },
});
