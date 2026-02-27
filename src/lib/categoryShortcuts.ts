/**
 * Keyboard shortcuts for categories beyond index 9.
 * Follows standard QWERTY keyboard row order.
 */
const LETTER_SHORTCUTS = [
  "q",
  "w",
  "e",
  "r",
  "t",
  "y",
  "u",
  "i",
  "o",
  "p",
  "a",
  "s",
  "d",
  "f",
  "g",
  "h",
  "j",
  "k",
  "l",
  "z",
  "x",
  "c",
  "v",
  "b",
  "n",
  "m",
] as const;

/**
 * Returns the keyboard shortcut label for a category at the given index.
 * Index 0-9: digit string. Index 10-35: QWERTY letter. 36+: null.
 */
export function getCategoryShortcutLabel(index: number): string | null {
  if (index < 0) return null;
  if (index <= 9) return String(index);
  const letterIndex = index - 10;
  if (letterIndex >= LETTER_SHORTCUTS.length) return null;
  return LETTER_SHORTCUTS[letterIndex];
}

/**
 * Given a keyboard event key, returns the category index it maps to.
 * Digits 0-9 → indices 0-9. Letters q,w,e,r,... → indices 10,11,12,...
 * Returns null if the key is not a valid category shortcut.
 */
export function getCategoryIndexFromKey(key: string): number | null {
  if (key.length !== 1) return null;
  const num = parseInt(key);
  if (!isNaN(num) && num >= 0 && num <= 9) return num;
  const letterIndex = LETTER_SHORTCUTS.indexOf(
    key.toLowerCase() as (typeof LETTER_SHORTCUTS)[number],
  );
  if (letterIndex !== -1) return 10 + letterIndex;
  return null;
}
