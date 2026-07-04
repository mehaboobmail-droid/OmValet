import { get, ref } from "firebase/database";
import { clientDb } from "@/firebase/client";
import { dbPaths } from "@/firebase/paths";
import type { CarsMap } from "@/hooks/useCars";
import type { ActivityEvent, HistoryRecord } from "@/types/domain";
import { addDays, dateKeyRange, localDateKey } from "@/utils/date";

/** One row per ticket in the admin report (legacy column set). */
export interface ReportRow {
  ticketId: string;
  date: string;
  timestamp: string;
  timeIn?: string;
  timeOut?: string;
  guest?: string;
  room?: string;
  make?: string;
  model?: string;
  color?: string;
  plate?: string;
  parkedBy?: string;
  slot?: string;
  notes?: string;
  retrievedBy?: string;
  valetUid?: string;
  status: "done" | "parked" | string;
}

export type ReportRange = "today" | "week" | "month" | "custom";

/** Date keys for a range, computed in hotel-local time (legacy used UTC). */
export function rangeDateKeys(
  range: ReportRange,
  customFrom?: string,
  customTo?: string,
): string[] {
  const todayKey = localDateKey();
  if (range === "today") return [todayKey];
  if (range === "week") {
    const now = new Date();
    return Array.from({ length: 7 }, (_, i) => localDateKey(addDays(now, i - 6)));
  }
  if (range === "month") {
    const [year, month] = todayKey.split("-").map(Number);
    const days = new Date(year, month, 0).getDate();
    return Array.from(
      { length: days },
      (_, i) =>
        `${year}-${String(month).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`,
    );
  }
  if (!customFrom || !customTo || customFrom > customTo) return [];
  return dateKeyRange(customFrom, customTo);
}

interface DayData {
  date: string;
  events: Record<string, ActivityEvent>;
  history: Record<string, HistoryRecord>;
}

/**
 * Load and merge the three legacy report sources:
 *  1. `activity/{date}` check-in/checkout events
 *  2. `history/{date}` full checked-out records (normalised into events)
 *  3. live `cars` whose check-in date falls inside the range
 *
 * All dates load in parallel — the legacy report awaited each date serially
 * (a month view was 62 sequential round-trips).
 */
export async function loadReportRows(
  dateKeys: string[],
  liveCars: CarsMap,
): Promise<{ rows: ReportRow[]; daysWithData: number }> {
  const db = clientDb();

  const days: DayData[] = await Promise.all(
    dateKeys.map(async (date) => {
      const [activitySnap, historySnap] = await Promise.all([
        get(ref(db, dbPaths.activity(date))),
        get(ref(db, dbPaths.history(date))),
      ]);
      return {
        date,
        events:
          (activitySnap.val() as Record<string, ActivityEvent> | null) ?? {},
        history:
          (historySnap.val() as Record<string, HistoryRecord> | null) ?? {},
      };
    }),
  );

  const rows = new Map<string, ReportRow>();
  let daysWithData = 0;

  const applyCheckin = (date: string, e: ActivityEvent) => {
    const row = rows.get(e.ticketId) ?? ({ ticketId: e.ticketId } as ReportRow);
    rows.set(e.ticketId, {
      ...row,
      ticketId: e.ticketId,
      date,
      timestamp: e.timestamp ?? "",
      timeIn: e.time,
      guest: e.guest,
      room: e.room,
      make: e.make,
      model: e.model,
      color: e.color,
      plate: e.plate,
      parkedBy: e.valetName,
      slot: e.slot,
      notes: e.notes || "—",
      valetUid: e.valetUid,
      status: row.status === "done" ? "done" : (e.status ?? "parked"),
    });
  };

  const applyCheckout = (e: ActivityEvent) => {
    const row = rows.get(e.ticketId) ?? ({ ticketId: e.ticketId } as ReportRow);
    rows.set(e.ticketId, {
      ...row,
      ticketId: e.ticketId,
      // Legacy showed the parking valet here by mistake; prefer the actual
      // retriever, fall back to the parker for old records.
      retrievedBy: e.retrievedBy || e.valetName,
      timeOut: e.time,
      status: "done",
    });
  };

  for (const day of days) {
    const hasData =
      Object.keys(day.events).length > 0 || Object.keys(day.history).length > 0;
    if (hasData) daysWithData += 1;

    for (const [key, event] of Object.entries(day.events)) {
      if (event.type === "checkin" || key.endsWith("_checkin")) {
        applyCheckin(day.date, event);
      } else {
        applyCheckout(event);
      }
    }

    // History records are authoritative for completed tickets.
    for (const [ticketId, h] of Object.entries(day.history)) {
      applyCheckin(day.date, {
        type: "checkin",
        ticketId,
        plate: h.plate,
        guest: h.guest,
        room: h.room,
        make: h.make,
        model: h.model,
        color: h.color,
        slot: h.slot,
        valetUid: h.valetUid,
        valetName: h.valetName,
        time: h.time,
        timestamp: h.timestamp,
        notes: h.notes,
        status: "done",
      });
      applyCheckout({
        type: "checkout",
        ticketId,
        plate: h.plate,
        guest: h.guest,
        slot: h.slot,
        valetUid: h.valetUid,
        valetName: h.valetName,
        retrievedBy: h.retrievedBy || "—",
        time: h.timeOut || "—",
        timestamp: h.timestampOut || "",
      });
    }
  }

  // Live cars still parked, filed under their check-in date.
  for (const car of Object.values(liveCars)) {
    const date = car.timestamp ? localDateKey(new Date(car.timestamp)) : localDateKey();
    if (!dateKeys.includes(date)) continue;
    if (rows.has(car.id) && rows.get(car.id)?.status === "done") continue;
    applyCheckin(date, {
      type: "checkin",
      ticketId: car.id,
      plate: car.plate,
      guest: car.guest,
      room: car.room,
      make: car.make,
      model: car.model,
      color: car.color,
      slot: car.slot,
      valetUid: car.valetUid,
      valetName: car.valetName,
      time: car.time,
      timestamp: car.timestamp,
      notes: car.notes,
      status: car.status,
    });
  }

  const sorted = [...rows.values()].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return (a.timestamp || "") < (b.timestamp || "") ? 1 : -1;
  });

  return { rows: sorted, daysWithData: Math.max(daysWithData, 1) };
}

/** Legacy CSV format: same headers, quoted values, commas in notes → ';'. */
export function buildReportCsv(rows: ReportRow[]): string {
  const headers = [
    "Time In",
    "Guest Name",
    "Suite #",
    "Make",
    "Colour",
    "Licence",
    "Parked By",
    "Spot #",
    "Retrieved By",
    "Time Out",
    "Notes",
  ];
  const lines = [headers.join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.timeIn ?? "",
        r.guest ?? "",
        r.room ?? "",
        r.make ?? "",
        r.color ?? "",
        r.plate ?? "",
        r.parkedBy ?? "",
        r.slot ?? "",
        r.retrievedBy ?? "",
        r.timeOut ?? "",
        (r.notes ?? "").replace(/,/g, ";").replace(/"/g, "'"),
      ]
        .map((value) => `"${value}"`)
        .join(","),
    );
  }
  return lines.join("\n");
}
