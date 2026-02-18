import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  categories: defineTable({
    userId: v.string(),
    name: v.string(),
    color: v.string(),
    sortOrder: v.number(),
    isArchived: v.boolean(),
  })
    .index("by_user", ["userId"])
    .index("by_user_sort_order", ["userId", "sortOrder"]),

  timeSlots: defineTable({
    userId: v.string(),
    date: v.string(),
    slotIndex: v.number(),
    categoryId: v.id("categories"),
    note: v.optional(v.string()),
  })
    .index("by_user_date", ["userId", "date"])
    .index("by_user_date_slot", ["userId", "date", "slotIndex"])
    .index("by_category", ["categoryId"]),

  weeklyGoals: defineTable({
    userId: v.string(),
    weekStart: v.string(),
    categoryId: v.id("categories"),
    goalHours: v.number(),
  })
    .index("by_user_week", ["userId", "weekStart"])
    .index("by_user_week_category", ["userId", "weekStart", "categoryId"]),
});
