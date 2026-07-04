"use client";

import { useEffect, useMemo, useState } from "react";
import { onValue, ref } from "firebase/database";
import { clientDb } from "@/firebase/client";
import { dbPaths } from "@/firebase/paths";
import type { DayShifts } from "@/types/domain";

/** shifts/{YYYY-MM} → { DD → { shiftTypeId → assignment } } */
type MonthShifts = Record<string, DayShifts>;

/**
 * Live shift assignments for a set of months, flattened to full date keys
 * ("YYYY-MM-DD" → DayShifts). Subscriptions follow the requested months —
 * the legacy portal only listened to a fixed 3-month window, so navigating
 * the calendar further showed silently-empty days.
 */
export function useShiftMonths(monthKeys: string[]): {
  byDate: Record<string, DayShifts>;
  loading: boolean;
} {
  const [byMonth, setByMonth] = useState<Record<string, MonthShifts>>({});
  const joined = [...new Set(monthKeys)].sort().join(",");

  useEffect(() => {
    const keys = joined ? joined.split(",") : [];
    const db = clientDb();
    const unsubscribers = keys.map((monthKey) =>
      onValue(ref(db, dbPaths.shiftsMonth(monthKey)), (snap) => {
        const value = (snap.val() as MonthShifts | null) ?? {};
        setByMonth((prev) => ({ ...prev, [monthKey]: value }));
      }),
    );
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [joined]);

  const byDate = useMemo(() => {
    const map: Record<string, DayShifts> = {};
    for (const [monthKey, days] of Object.entries(byMonth)) {
      for (const [day, shifts] of Object.entries(days)) {
        map[`${monthKey}-${day}`] = shifts;
      }
    }
    return map;
  }, [byMonth]);

  const loading = joined
    .split(",")
    .filter(Boolean)
    .some((key) => !(key in byMonth));

  return { byDate, loading };
}
