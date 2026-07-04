import { NextResponse } from "next/server";
import { adminDb } from "@/firebase/admin";
import { dbPaths } from "@/firebase/paths";
import { sendSms } from "@/services/twilio";
import type { ShiftAssignment, StaffProfile } from "@/types/domain";
import { localDateKey, localDayKey, localMonthKey } from "@/utils/date";

/**
 * Daily shift-reminder job — invoked by Vercel Cron (see vercel.json,
 * 02:30 UTC = 08:00 IST). SMS every valet assigned to a shift today and log
 * any unfilled shifts.
 *
 * Protected by CRON_SECRET: Vercel Cron sends `Authorization: Bearer
 * <CRON_SECRET>` when that env var is set. Requires FIREBASE_SERVICE_ACCOUNT.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    return NextResponse.json(
      { ok: false, error: "FIREBASE_SERVICE_ACCOUNT not set" },
      { status: 503 },
    );
  }

  const todayKey = localDateKey();
  const monthKey = localMonthKey();
  const dayKey = localDayKey();
  const db = adminDb();

  const [shiftsSnap, typesSnap, staffSnap] = await Promise.all([
    db.ref(dbPaths.shiftsDay(monthKey, dayKey)).get(),
    db.ref(dbPaths.shiftTypes).get(),
    db.ref(dbPaths.staff).get(),
  ]);

  const assignments =
    (shiftsSnap.val() as Record<string, ShiftAssignment> | null) ?? {};
  const shiftTypes = (typesSnap.val() as Record<string, unknown> | null) ?? {};
  const staff = (staffSnap.val() as Record<string, StaffProfile> | null) ?? {};

  let sent = 0;
  for (const assignment of Object.values(assignments)) {
    const phone = staff[assignment.valetUid]?.phone;
    if (!phone) continue;
    const result = await sendSms(
      phone,
      `Hi ${assignment.valetName}, reminder: your ${assignment.shiftName} shift is today (${assignment.start}–${assignment.end}). -Valet Mgmt`,
    );
    if (result.success) sent += 1;
  }

  const unfilled = Object.keys(shiftTypes).filter((id) => !assignments[id]);
  const summary = {
    ok: true,
    date: todayKey,
    assigned: Object.keys(assignments).length,
    remindersSent: sent,
    unfilled: unfilled.length,
  };
  console.log("shift-alert:", JSON.stringify(summary));
  return NextResponse.json(summary);
}
