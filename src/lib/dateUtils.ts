import { format, addDays, subDays, startOfWeek, endOfWeek, isToday } from "date-fns";

export function toDateString(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function fromDateString(dateStr: string): Date {
  return new Date(dateStr + "T00:00:00");
}

export function formatDisplayDate(date: Date): string {
  return format(date, "EEEE, MMM d, yyyy");
}

export function getNextDay(dateStr: string): string {
  return toDateString(addDays(fromDateString(dateStr), 1));
}

export function getPrevDay(dateStr: string): string {
  return toDateString(subDays(fromDateString(dateStr), 1));
}

export function getWeekStart(dateStr: string): string {
  return toDateString(startOfWeek(fromDateString(dateStr), { weekStartsOn: 1 }));
}

export function getWeekEnd(dateStr: string): string {
  return toDateString(endOfWeek(fromDateString(dateStr), { weekStartsOn: 1 }));
}

export function isDateToday(dateStr: string): boolean {
  return isToday(fromDateString(dateStr));
}

export function todayString(): string {
  return toDateString(new Date());
}
