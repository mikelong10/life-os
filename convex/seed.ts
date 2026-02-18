export const CATEGORY_PALETTE = [
  "#2D5F3E", // deep forest green
  "#6B8F71", // sage green
  "#A67B5B", // warm brown
  "#C4A77D", // sand/tan
  "#8B6F47", // dark tan
  "#7A8B99", // cool slate
  "#B8860B", // dark goldenrod
  "#8FBC8F", // dark sea green
  "#CD853F", // peru/terracotta
  "#708090", // slate gray
  "#556B2F", // dark olive green
  "#BC8F8F", // rosy brown
  "#9DB4C0", // pewter blue
] as const;

export const DEFAULT_CATEGORIES = [
  { name: "Sleep", color: CATEGORY_PALETTE[7] },
  { name: "Deep Work", color: CATEGORY_PALETTE[0] },
  { name: "Meetings", color: CATEGORY_PALETTE[5] },
  { name: "Admin/Email", color: CATEGORY_PALETTE[9] },
  { name: "Relationship", color: CATEGORY_PALETTE[11] },
  { name: "Exercise", color: CATEGORY_PALETTE[1] },
  { name: "Meals/Cooking", color: CATEGORY_PALETTE[6] },
  { name: "Commute", color: CATEGORY_PALETTE[4] },
  { name: "Social", color: CATEGORY_PALETTE[3] },
  { name: "Leisure/Screen Time", color: CATEGORY_PALETTE[12] },
  { name: "Reading", color: CATEGORY_PALETTE[10] },
  { name: "Personal Development", color: CATEGORY_PALETTE[2] },
  { name: "Errands", color: CATEGORY_PALETTE[8] },
] as const;
