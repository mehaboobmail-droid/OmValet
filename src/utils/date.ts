import { TIMEZONE } from "@/constants";

/**
 * All persisted date keys are computed in hotel-local time (Asia/Kolkata).
 * The legacy system used UTC (`toISOString`), which mis-filed records between
 * midnight and 05:30 IST — these helpers fix that while keeping key formats.
 */

/** "YYYY-MM-DD" in hotel-local time. en-CA locale yields ISO ordering. */
export function localDateKey(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** "YYYY-MM" in hotel-local time. */
export function localMonthKey(date: Date = new Date()): string {
  return localDateKey(date).slice(0, 7);
}

/** "DD" day-of-month key used under shifts/{YYYY-MM}/. */
export function localDayKey(date: Date = new Date()): string {
  return localDateKey(date).slice(8, 10);
}

/** Display time, e.g. "02:41 PM" — matches legacy ticket format. */
export function formatTime(date: Date = new Date()): string {
  return date.toLocaleTimeString("en-US", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Display date-time, e.g. "Jul 3, 2026, 02:41 PM". */
export function formatDateTime(date: Date = new Date()): string {
  return date.toLocaleString("en-US", {
    timeZone: TIMEZONE,
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Human date from a "YYYY-MM-DD" key, e.g. "Friday, July 3, 2026". */
export function formatDateKey(
  dateKey: string,
  options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  },
): string {
  // Noon UTC avoids the date shifting in any timezone.
  return new Date(`${dateKey}T12:00:00Z`).toLocaleDateString("en-US", {
    timeZone: TIMEZONE,
    ...options,
  });
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** Inclusive list of "YYYY-MM-DD" keys between two keys. */
export function dateKeyRange(fromKey: string, toKey: string): string[] {
  const keys: string[] = [];
  let cursor = new Date(`${fromKey}T12:00:00Z`);
  const end = new Date(`${toKey}T12:00:00Z`);
  while (cursor <= end && keys.length < 366) {
    keys.push(cursor.toISOString().slice(0, 10));
    cursor = addDays(cursor, 1);
  }
  return keys;
}
