import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  categories: defineTable({
    name: v.string(),
    color: v.string(),
    sortOrder: v.number(),
    isArchived: v.boolean(),
  }).index("by_sort_order", ["sortOrder"]),

  timeSlots: defineTable({
    date: v.string(),
    slotIndex: v.number(),
    categoryId: v.id("categories"),
    note: v.optional(v.string()),
  })
    .index("by_date", ["date"])
    .index("by_date_slot", ["date", "slotIndex"])
    .index("by_category", ["categoryId"]),

  weeklyGoals: defineTable({
    weekStart: v.string(),
    categoryId: v.id("categories"),
    goalHours: v.number(),
  })
    .index("by_week", ["weekStart"])
    .index("by_week_category", ["weekStart", "categoryId"]),
});
