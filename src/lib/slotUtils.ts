export function slotIndexToTime(index: number): string {
  const hours = Math.floor(index / 2);
  const minutes = (index % 2) * 30;
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
}

export function slotIndexToTimeShort(index: number): string {
  const hours = Math.floor(index / 2);
  const minutes = (index % 2) * 30;
  const period = hours >= 12 ? "p" : "a";
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  if (minutes === 0) return `${displayHours}${period}`;
  return `${displayHours}:${minutes.toString().padStart(2, "0")}${period}`;
}

export function slotIndexToTimeRange(index: number): string {
  return `${slotIndexToTime(index)} – ${slotIndexToTime(index + 1 > 47 ? 0 : index + 1)}`;
}
