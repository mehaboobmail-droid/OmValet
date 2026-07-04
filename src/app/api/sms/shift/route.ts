import { NextResponse } from "next/server";
import { z } from "zod";
import { adminAuth } from "@/firebase/admin";
import { sendFast2Sms } from "@/services/fast2sms";
import { phoneSchema } from "@/types/schemas";
import { formatDateKey } from "@/utils/date";

/**
 * Shift confirmation SMS to a valet. The legacy portal called a
 * `send-shift-sms` Netlify function that never existed — every shift SMS
 * silently failed. This implements it, staff-token-gated, with the message
 * composed server-side from structured fields (no arbitrary-text relay).
 */
const payloadSchema = z.object({
  phone: phoneSchema,
  valetName: z.string().trim().min(1).max(60),
  shiftName: z.string().trim().min(1).max(30),
  dateKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start: z.string().regex(/^\d{2}:\d{2}$/),
  end: z.string().regex(/^\d{2}:\d{2}$/),
});

export async function POST(request: Request) {
  const bearer = request.headers.get("authorization") ?? "";
  const idToken = bearer.startsWith("Bearer ") ? bearer.slice(7) : "";
  if (!idToken) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }
  try {
    await adminAuth().verifyIdToken(idToken);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("FIREBASE_SERVICE_ACCOUNT")) {
      return NextResponse.json(
        { success: false, error: "SMS service not configured on server" },
        { status: 503 },
      );
    }
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid fields" },
      { status: 400 },
    );
  }
  const { phone, valetName, shiftName, dateKey, start, end } = parsed.data;

  // Legacy message format.
  const prettyDate = formatDateKey(dateKey, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const message = `Hi ${valetName}, your ${shiftName} shift is confirmed for ${prettyDate} (${start}–${end}). -Valet Mgmt`;

  const result = await sendFast2Sms(phone, message);
  return NextResponse.json(result, {
    status: result.success || result.error !== "SMS service not configured on server" ? 200 : 503,
  });
}
