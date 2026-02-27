import { v } from "convex/values";

import { query, mutation, type QueryCtx, type MutationCtx } from "./_generated/server";
import { DEFAULT_CATEGORIES } from "./seed";

async function getAuthUserId(ctx: QueryCtx | MutationCtx): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");
  return identity.tokenIdentifier;
}

export const list = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    return await ctx.db
      .query("categories")
      .withIndex("by_user_sort_order", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isArchived"), false))
      .collect();
  },
});

export const listAll = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    return await ctx.db
      .query("categories")
      .withIndex("by_user_sort_order", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    color: v.string(),
    sortOrder: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    return await ctx.db.insert("categories", {
      userId,
      name: args.name,
      color: args.color,
      sortOrder: args.sortOrder,
      isArchived: false,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("categories"),
    name: v.optional(v.string()),
    color: v.optional(v.string()),
    sortOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const category = await ctx.db.get(args.id);
    if (!category || category.userId !== userId) {
      throw new Error("Not authorized");
    }
    const { id, ...fields } = args;
    const updates: Record<string, string | number> = {};
    if (fields.name !== undefined) updates.name = fields.name;
    if (fields.color !== undefined) updates.color = fields.color;
    if (fields.sortOrder !== undefined) updates.sortOrder = fields.sortOrder;
    await ctx.db.patch(id, updates);
  },
});

export const archive = mutation({
  args: { id: v.id("categories") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const category = await ctx.db.get(args.id);
    if (!category || category.userId !== userId) {
      throw new Error("Not authorized");
    }
    await ctx.db.patch(args.id, { isArchived: true });
  },
});

export const reorder = mutation({
  args: { orderedIds: v.array(v.id("categories")) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    for (let i = 0; i < args.orderedIds.length; i++) {
      const category = await ctx.db.get(args.orderedIds[i]);
      if (!category || category.userId !== userId) {
        throw new Error("Not authorized");
      }
      await ctx.db.patch(args.orderedIds[i], { sortOrder: i });
    }
  },
});

export const seed = mutation({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    const existing = await ctx.db
      .query("categories")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (existing) return;

    for (let i = 0; i < DEFAULT_CATEGORIES.length; i++) {
      const cat = DEFAULT_CATEGORIES[i];
      await ctx.db.insert("categories", {
        userId,
        name: cat.name,
        color: cat.color,
        sortOrder: i,
        isArchived: false,
      });
    }
  },
});

export const reseed = mutation({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    const all = await ctx.db
      .query("categories")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const cat of all) {
      await ctx.db.delete(cat._id);
    }
    for (let i = 0; i < DEFAULT_CATEGORIES.length; i++) {
      const cat = DEFAULT_CATEGORIES[i];
      await ctx.db.insert("categories", {
        userId,
        name: cat.name,
        color: cat.color,
        sortOrder: i,
        isArchived: false,
      });
    }
  },
});
