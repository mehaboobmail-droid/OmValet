/**
 * Scheduled daily at 02:30 UTC (08:00 IST) — see netlify.toml.
 *
 * The legacy netlify.toml declared this function but it never existed.
 * Behaviour: SMS every valet assigned to one of today's shifts a reminder,
 * and log any unfilled shifts (admins also get an in-app warning when they
 * open the scheduler).
 *
 * Standalone by design: Netlify bundles this outside the Next.js build, so
 * it cannot use the app's `@/` imports. Requires FIREBASE_SERVICE_ACCOUNT
 * and FAST2SMS_API_KEY.
 */
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";

interface ShiftAssignment {
  valetUid: string;
  valetName: string;
  shiftName: string;
  start: string;
  end: string;
}

interface StaffProfile {
  name?: string;
  phone?: string;
}

const TIMEZONE = "Asia/Kolkata";

function istDateKey(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function db() {
  const app =
    getApps()[0] ??
    initializeApp({
      credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT ?? "")),
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    });
  return getDatabase(app);
}

async function sendSms(phone: string, message: string): Promise<boolean> {
  const apiKey = process.env.FAST2SMS_API_KEY;
  const clean = phone.replace(/\D/g, "").replace(/^91/, "").slice(-10);
  if (!apiKey || clean.length !== 10) return false;
  try {
    const res = await fetch(
      "https://www.fast2sms.com/dev/bulkV2" +
        `?authorization=${apiKey}&route=q&message=${encodeURIComponent(message)}` +
        `&language=english&flash=0&numbers=${clean}`,
      { signal: AbortSignal.timeout(8000) },
    );
    const data = (await res.json()) as { return?: boolean };
    return data.return === true;
  } catch {
    return false;
  }
}

export default async function handler(): Promise<Response> {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.log("shift-alert: FIREBASE_SERVICE_ACCOUNT not set — skipping");
    return new Response("not configured", { status: 200 });
  }

  const todayKey = istDateKey();
  const monthKey = todayKey.slice(0, 7);
  const dayKey = todayKey.slice(8, 10);

  const database = db();
  const [shiftsSnap, typesSnap, staffSnap] = await Promise.all([
    database.ref(`shifts/${monthKey}/${dayKey}`).get(),
    database.ref("shiftTypes").get(),
    database.ref("valets").get(),
  ]);

  const assignments =
    (shiftsSnap.val() as Record<string, ShiftAssignment> | null) ?? {};
  const shiftTypes = (typesSnap.val() as Record<string, unknown> | null) ?? {};
  const staff = (staffSnap.val() as Record<string, StaffProfile> | null) ?? {};

  let sent = 0;
  for (const assignment of Object.values(assignments)) {
    const phone = staff[assignment.valetUid]?.phone;
    if (!phone) continue;
    const ok = await sendSms(
      phone,
      `Hi ${assignment.valetName}, reminder: your ${assignment.shiftName} shift is today (${assignment.start}–${assignment.end}). -Valet Mgmt`,
    );
    if (ok) sent += 1;
  }

  const unfilled = Object.keys(shiftTypes).filter((id) => !assignments[id]);
  console.log(
    `shift-alert ${todayKey}: ${Object.keys(assignments).length} assigned, ` +
      `${sent} reminders sent, unfilled: ${unfilled.length ? unfilled.join(", ") : "none"}`,
  );

  return new Response("ok", { status: 200 });
}
