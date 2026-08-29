export const STANDARD_DURATION_MIN = 9 * 60; // 09:00 on regular working days
export const SATURDAY_DURATION_MIN = 8 * 60 + 15; // 08:15 on Saturdays
export const SHORT_LEAVE_DEDUCTION_MIN = 45; // minus 45 minutes when short leave is taken (regular days)
export const SATURDAY_SHORT_LEAVE_DEDUCTION_MIN = 30; // minus 30 minutes when short leave is taken on Saturday

export const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export type DayName = (typeof DAYS)[number];

/** Base shift duration (in minutes) for a given day of the week. */
export function baseDurationForDay(day: DayName): number {
  return day === "Saturday" ? SATURDAY_DURATION_MIN : STANDARD_DURATION_MIN;
}

/** Short leave deduction (in minutes) for a given day of the week. */
export function shortLeaveDeductionForDay(day: DayName): number {
  return day === "Saturday"
    ? SATURDAY_SHORT_LEAVE_DEDUCTION_MIN
    : SHORT_LEAVE_DEDUCTION_MIN;
}

/** Parses a "HH:MM" (24h) input value into total minutes since 00:00. */
export function parseTimeToMinutes(value: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

/**
 * Parses a freely-typed time like "9", "9:15", "9:15am", "09:15 PM", or
 * "21:15" into total minutes since 00:00. Returns null if unparseable.
 */
export function parseFlexibleTime(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const match = /^(\d{1,2})(?::?([0-5]\d))?\s*([AaPp][Mm])?$/.exec(trimmed);
  if (!match) return null;

  const rawHours = Number(match[1]);
  const minutes = match[2] ? Number(match[2]) : 0;
  const meridiem = match[3]?.toUpperCase();

  if (meridiem) {
    if (rawHours < 1 || rawHours > 12) return null;
    const hours24 =
      meridiem === "AM"
        ? rawHours % 12
        : (rawHours % 12) + 12;
    return hours24 * 60 + minutes;
  }

  if (rawHours > 23) return null;
  return rawHours * 60 + minutes;
}

/** Formats total minutes since 00:00 into a 12-hour clock reading, e.g. "5:15 PM". */
export function formatClock(totalMinutes: number): string {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const hours24 = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  const period = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hours12}:${String(minutes).padStart(2, "0")} ${period}`;
}

/** Formats a minute count as "Hh MMm", e.g. "8h 15m". */
export function formatDuration(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${String(minutes).padStart(2, "0")}m`;
}

/** Formats a Date as "21 Apr 2004" style, for the ticket header. */
export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** True if the exit time rolls over into the next calendar day. */
export function crossesMidnight(startMinutes: number, durationMinutes: number): boolean {
  return startMinutes + durationMinutes >= 1440;
}
