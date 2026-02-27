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

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l * 100];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h * 360, s * 100, l * 100];
}

function hslToHex(h: number, s: number, l: number): string {
  const hN = h / 360,
    sN = s / 100,
    lN = l / 100;
  const q = lN < 0.5 ? lN * (1 + sN) : lN + sN - lN * sN;
  const p = 2 * lN - q;
  const toRgb = (t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const r = Math.round(toRgb(hN + 1 / 3) * 255);
  const g = Math.round(toRgb(hN) * 255);
  const b = Math.round(toRgb(hN - 1 / 3) * 255);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

/** Returns the best next color for a new category.
 * Prefers an unused palette color; when all are taken, generates a muted
 * earthy tone that is maximally distinct in hue from all existing colors. */
export function getNextCategoryColor(usedColors: string[]): string {
  const usedSet = new Set(usedColors.map((c) => c.toLowerCase()));
  const unused = CATEGORY_PALETTE.find((c) => !usedSet.has(c.toLowerCase()));
  if (unused) return unused;

  // All palette colors are taken – find the largest hue gap and split it.
  const hues = usedColors.map((hex) => hexToHsl(hex)[0]);
  const sorted = [...hues].sort((a, b) => a - b);
  let maxGap = 0;
  let bestHue = 0;
  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    const next = i < sorted.length - 1 ? sorted[i + 1] : sorted[0] + 360;
    const gap = next - current;
    if (gap > maxGap) {
      maxGap = gap;
      bestHue = (current + gap / 2) % 360;
    }
  }
  // Use muted saturation/lightness consistent with the app palette.
  return hslToHex(bestHue, 32, 52);
}

export const SLOTS_PER_DAY = 48;
export const SLOT_DURATION_MINUTES = 30;
